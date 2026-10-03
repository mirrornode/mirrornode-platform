"""Exercise the guard and bearer check without service calls or retired-key literals.

Run with Python 3.14 and Git history available: python -B -m unittest discover
-s tests/python -p 'test_*.py' -v. Historical bytecode is inspected, never executed.
"""

import hashlib
import hmac
import importlib.util
import marshal
import os
from pathlib import Path
import runpy
import subprocess
import sys
from types import CodeType, ModuleType
import unittest
from unittest.mock import Mock, patch


REPO_ROOT = Path(__file__).resolve().parents[2]
ROTAN_SOURCE = REPO_ROOT / "app/osiris/rotan_routes.py"
HISTORICAL_BLOB = "5bb35cf1b5dd1ec72fd16e4e0d35aedf08d350de"
RETIRED_KEY_DIGEST = "81e2693f4722a2035689fa4052f3cf6e73cc93adcfbff031608c2d75f2d57a55"


def retired_key_from_history():
    result = subprocess.run(
        ["git", "show", HISTORICAL_BLOB], cwd=REPO_ROOT,
        capture_output=True, check=False,
    )
    if result.returncode:
        raise RuntimeError("Pinned historical blob unavailable; fetch Git history")
    if result.stdout[:4] != importlib.util.MAGIC_NUMBER:
        raise RuntimeError("Historical bytecode inspection requires Python 3.14")

    matches = set()

    def inspect_constants(code):
        for value in code.co_consts:
            if isinstance(value, CodeType):
                inspect_constants(value)
            elif isinstance(value, str):
                if hashlib.sha256(value.encode()).hexdigest() == RETIRED_KEY_DIGEST:
                    matches.add(value)

    inspect_constants(marshal.loads(result.stdout[16:]))
    if len(matches) != 1:
        raise RuntimeError("Pinned retired-key digest must identify one historical value")
    return matches.pop()


class StubHTTPException(Exception):
    def __init__(self, status_code, detail):
        super().__init__(detail)
        self.status_code = status_code


class RotanStartupTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.retired_key = retired_key_from_history()

    def setUp(self):
        fastapi = ModuleType("fastapi")
        router = Mock()
        router.post.side_effect = lambda *args, **kwargs: lambda function: function
        router.get.side_effect = lambda *args, **kwargs: lambda function: function
        fastapi.APIRouter = Mock(return_value=router)
        fastapi.Depends = Mock(return_value=None)
        fastapi.Header = Mock(return_value=None)
        fastapi.HTTPException = StubHTTPException

        pydantic = ModuleType("pydantic")
        pydantic.BaseModel = type("BaseModel", (), {})
        supabase = ModuleType("supabase")
        self.create_client = supabase.create_client = Mock()

        self.enterContext(patch.dict(sys.modules, {
            "fastapi": fastapi, "pydantic": pydantic, "supabase": supabase,
        }))
        self.enterContext(patch.dict(os.environ, {
            "SUPABASE_URL": "https://example.invalid",
            "SUPABASE_SERVICE_KEY": "test-service-key",
        }, clear=True))

    def test_retired_key_rejected_before_client_creation(self):
        os.environ["ROTAN_DEV_KEY"] = self.retired_key
        with self.assertRaisesRegex(RuntimeError, "^ROTAN_DEV_KEY must not use the retired development default$"):
            runpy.run_path(str(ROTAN_SOURCE))
        self.create_client.assert_not_called()

    def test_missing_key_rejected_before_client_creation(self):
        with self.assertRaisesRegex(RuntimeError, "^ROTAN_DEV_KEY must be set$"):
            runpy.run_path(str(ROTAN_SOURCE))
        self.create_client.assert_not_called()

    def test_empty_key_rejected_before_client_creation(self):
        os.environ["ROTAN_DEV_KEY"] = ""
        with self.assertRaisesRegex(RuntimeError, "^ROTAN_DEV_KEY must be set$"):
            runpy.run_path(str(ROTAN_SOURCE))
        self.create_client.assert_not_called()

    def test_non_retired_key_reaches_stubbed_client(self):
        os.environ["ROTAN_DEV_KEY"] = "test-only-non-retired-key"
        runpy.run_path(str(ROTAN_SOURCE))
        self.create_client.assert_called_once_with(
            "https://example.invalid", "test-service-key",
        )

    def load_verifier(self, key="test-only-non-retired-key"):
        os.environ["ROTAN_DEV_KEY"] = key
        return runpy.run_path(str(ROTAN_SOURCE))["verify_bearer"]

    def test_matching_bearer_uses_constant_time_comparison(self):
        key = "test-only-non-retired-key"
        verify_bearer = self.load_verifier(key)
        with patch.object(hmac, "compare_digest", wraps=hmac.compare_digest) as compare:
            self.assertEqual(verify_bearer("bEaReR " + key), key)
        compare.assert_called_once_with(key.encode(), key.encode())

    def test_mismatching_bearers_are_forbidden(self):
        key = "test-only-non-retired-key"
        verify_bearer = self.load_verifier(key)
        for token in ("", "wrong", key[:-1] + "X", "non-ascii-\u00e9"):
            with self.subTest(token=token):
                with patch.object(hmac, "compare_digest", wraps=hmac.compare_digest) as compare:
                    with self.assertRaises(StubHTTPException) as raised:
                        verify_bearer("Bearer " + token)
                self.assertEqual(raised.exception.status_code, 403)
                compare.assert_called_once_with(token.encode(), key.encode())

    def test_non_ascii_key_can_match(self):
        key = "test-only-non-ascii-\u00e9"
        verify_bearer = self.load_verifier(key)
        self.assertEqual(verify_bearer("Bearer " + key), key)

    def test_invalid_scheme_is_unauthorized_without_comparison(self):
        verify_bearer = self.load_verifier()
        for authorization in ("", "Basic test-only-non-retired-key", "Digest token"):
            with self.subTest(authorization=authorization):
                with patch.object(hmac, "compare_digest", wraps=hmac.compare_digest) as compare:
                    with self.assertRaises(StubHTTPException) as raised:
                        verify_bearer(authorization)
                self.assertEqual(raised.exception.status_code, 401)
                compare.assert_not_called()


if __name__ == "__main__":
    unittest.main()
