# Osiris Runtime Audit Studio Schema v0.1

## Purpose

Osiris is a runtime audit studio: one governed delivery pipeline, many evidence adapters.

The client-facing audit sequence remains stable across domains. Runtime-specific logic is handled through adapters that define evidence sources, threat models, finding taxonomies, and proof formats.

## Universal Audit Sequence

Every Osiris audit follows the same visible sequence:

1. Scope Freeze
2. Architecture Review
3. Evidence Review
4. Automated Checks
5. Manual / Guided Review
6. Severity Classification
7. Remediation Plan
8. Fix Verification
9. Final Delivery Artifact

## Core Entities

### AuditEngagement

Represents one paid or internal audit engagement.

Required fields:

- id
- title
- client_name
- runtime_family
- adapter_id
- status
- created_at
- updated_at
- scope
- evidence_sources
- findings
- remediation_items
- verification_status
- delivery_artifacts

### AuditScope

Defines what is and is not included.

Required fields:

- included_systems
- excluded_systems
- repositories
- deployed_addresses
- environments
- assumptions
- known_constraints
- frozen_at
- approved_by

### RuntimeAdapter

Defines the audit lens for a runtime family.

Required fields:

- id
- name
- runtime_family
- primitives
- trust_boundaries
- evidence_sources
- common_bug_classes
- finding_sublabels
- proof_format
- required_artifacts

Initial runtime families:

- evm
- solana_svm
- move
- cosmos_ibc
- ai_agent_stack
- workflow_ops

### EvidenceSource

Represents one source of audit evidence.

Required fields:

- id
- type
- source_uri
- description
- collected_at
- integrity_status
- adapter_context
- linked_findings

Evidence source types may include:

- repository
- deployment_config
- contract_address
- rpc_trace
- event_log
- transaction
- account_snapshot
- permission_map
- prompt_config
- tool_manifest
- memory_index
- workflow_document
- manual_note

### Finding

Represents one audit finding.

Required fields:

- id
- title
- severity
- runtime_sublabel
- description
- affected_components
- evidence_links
- impact
- likelihood
- recommendation
- status
- created_at
- updated_at

Shared severity values:

- critical
- high
- medium
- low
- informational

### RemediationItem

Represents one recommended fix.

Required fields:

- id
- finding_id
- owner
- recommendation
- implementation_status
- verification_required
- verification_notes

### Verification

Represents proof that a fix was reviewed.

Required fields:

- id
- finding_id
- method
- evidence_links
- result
- verified_at
- verified_by

Verification results:

- passed
- failed
- partial
- not_applicable

### DeliveryArtifact

Represents the final client-facing artifact.

Required fields:

- id
- engagement_id
- artifact_type
- title
- status
- generated_at
- delivery_uri
- visibility

Artifact types:

- audit_report
- executive_summary
- evidence_dossier
- remediation_tracker
- verification_report
- client_hud_snapshot

## Adapter Rule

The Osiris client-facing sequence should not change unless the buyer experience requires it.

Adapters may change:

- evidence model
- threat model
- finding taxonomy
- proof format
- runtime-specific checklist
- automated check suite

Adapters may not change:

- universal audit sequence
- top-level severity rubric
- delivery artifact contract
- governance metadata requirements

## Initial Adapter Priority

Phase 1 adapters:

1. EVM
2. Solana/SVM

Reason:

EVM and Solana have radically different execution models. If the same Osiris schema can support both, the runtime audit studio concept is validated.

## Product Principle

Osiris does not sell opinions.

Osiris sells governed audit artifacts: scoped evidence, classified findings, remediation paths, and verification records.

