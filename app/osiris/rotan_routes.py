from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import hashlib, uuid, time
from supabase import create_client
import os

router = APIRouter(prefix="/rotan-q")
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
ROTAN_DEV_KEY = os.environ.get("ROTAN_DEV_KEY")
if not ROTAN_DEV_KEY:
    raise RuntimeError("ROTAN_DEV_KEY must be set")

def verify_bearer(authorization: str = Header(...)):
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        raise HTTPException(401, "Invalid auth scheme")
    if token != ROTAN_DEV_KEY:
        raise HTTPException(403, "Forbidden")
    return token

def compute_merkle_hash(prev_hash, sequence_id, user_ct, oracle_ct):
    payload = f"{prev_hash}:{sequence_id}:{user_ct}:{oracle_ct}"
    return hashlib.sha256(payload.encode()).hexdigest()

def get_chain_tip():
    res = (supabase.table("rotan_conversations")
           .select("sequence_id, merkle_hash")
           .order("sequence_id", desc=True)
           .limit(1)
           .execute())
    if res.data:
        return res.data[0]["sequence_id"], res.data[0]["merkle_hash"]
    return 0, "genesis"

class ConverseRequest(BaseModel):
    message: dict
    response: dict
    encrypted: bool = True
    timestamp: Optional[str] = None
    sequence_id: Optional[int] = None
    key_id: Optional[str] = None

class KeyRequest(BaseModel):
    public_key_material: str
    derivation_params: dict

@router.post("/converse")
async def converse(body: ConverseRequest, _=Depends(verify_bearer)):
    tip_seq, prev_hash = get_chain_tip()
    seq = body.sequence_id or (tip_seq + 1)
    merkle = compute_merkle_hash(prev_hash, seq,
                                  body.message["ciphertext"],
                                  body.response["ciphertext"])
    record = {
        "id": str(uuid.uuid4()),
        "sequence_id": seq,
        "user_message":    body.message["ciphertext"],
        "user_iv":         body.message["iv"],
        "user_tag":        body.message["tag"],
        "oracle_response": body.response["ciphertext"],
        "oracle_iv":       body.response["iv"],
        "oracle_tag":      body.response["tag"],
        "merkle_hash":     merkle,
        "prev_hash":       prev_hash,
        "timestamp":       body.timestamp or time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "key_id":          body.key_id
    }
    res = supabase.table("rotan_conversations").insert(record).execute()
    if not res.data:
        raise HTTPException(500, "Ledger write failed")
    return {
        "ledger_id":     record["id"],
        "merkle_proof":  merkle,
        "prev_hash":     prev_hash,
        "next_sequence": seq + 1
    }

@router.get("/history")
async def history(limit: int = 100, encrypted: bool = True,
                  _=Depends(verify_bearer)):
    res = (supabase.table("rotan_conversations")
           .select("*")
           .order("sequence_id", asc=True)
           .limit(limit)
           .execute())
    rows = res.data or []
    tip = rows[-1]["merkle_hash"] if rows else "genesis"
    seq_range = ({"start": rows[0]["sequence_id"], "end": rows[-1]["sequence_id"]}
                 if rows else {"start": 0, "end": 0})
    return {"conversations": rows, "ledger_root": tip, "sequence_range": seq_range}

@router.post("/keys")
async def register_key(body: KeyRequest, _=Depends(verify_bearer)):
    key_id = hashlib.sha256(body.public_key_material.encode()).hexdigest()[:16]
    supabase.table("rotan_keys").upsert({
        "key_id":              key_id,
        "public_key_material": body.public_key_material,
        "derivation_params":   str(body.derivation_params),
        "encryption_scheme":   "AES-256-GCM"
    }).execute()
    return {"key_id": key_id, "encryption_scheme": "AES-256-GCM"}
