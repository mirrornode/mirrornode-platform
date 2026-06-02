# mirrornode-platform — developer tooling
# Usage: make <target>

VENV_DIR      := .venv
PYTHON        := $(VENV_DIR)/bin/python
PIP           := $(VENV_DIR)/bin/pip
PINECONE_REQS := scripts/pinecone/requirements.txt

.PHONY: venv pinecone-deps pinecone-smoke help

## help: list available targets
help:
	@grep -E '^##' Makefile | sed 's/## /  /'

## venv: create .venv and upgrade pip
venv:
	test -d $(VENV_DIR) || python3 -m venv $(VENV_DIR)
	$(PIP) install --upgrade pip --quiet

## pinecone-deps: install Pinecone requirements into .venv
pinecone-deps: venv
	$(PIP) install -r $(PINECONE_REQS) --quiet

## pinecone-smoke: end-to-end Pinecone connectivity check
## Reads PINECONE_API_KEY from env or .env at repo root
pinecone-smoke: pinecone-deps
	$(PYTHON) -m scripts.pinecone.smoke
