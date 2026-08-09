# OSIRIS STRUCTURAL REVIEW STANDARD — v0.1-RC1

**Status:** Release candidate for Operator redline and Customer Zero execution. Revise to v0.2 only after one Customer Zero report and one adversarial review.

**Authority scope:** This is a platform-local delivery standard for Osiris Audit v1. It does not create or amend MIRRORNODE canonical authority, agent authority, or cross-repository capability boundaries. Where this document conflicts with CORE-HUB canon, a signed engagement, or the published offer, delivery stops until the conflict is resolved. The reviewer may not silently choose the more convenient interpretation. Any rule here that would require a new canonical capability or authority boundary remains non-governing until separately accepted and referenced in MIRRORNODE-CORE-HUB.

**Delivery rule:** Within the authority already granted by applicable canon and engagement terms, this document governs the contents and method of a paying-customer Osiris review.

**Inherited practice statement:** This standard adapts established lightweight architecture-review methods, code-audit reporting practice, and evidence disciplines used in assurance work. Osiris claims novelty only in its specific combination: fixed-scope single-pass review, mandatory epistemic labeling of material statements, commit-pinned evidence citations, and a published exclusion and refusal list.

## 1. Purpose and professional boundary

Osiris Audit v1 is a bounded structural review of an AI-enabled software system: one pass, performed by hand with AI-assisted analysis, at a declared scope, producing a written report. Its purpose is to give a founder or small technical team an accurate structural picture of the reviewed system and a short, honest, prioritized list of what to address next.

It is not penetration testing; legal, tax, medical, or regulatory advice; compliance certification; exhaustive line-by-line code review; performance benchmarking; a guarantee of vulnerability discovery; remediation implementation; or an assurance of safety or production readiness.

The report must carry this boundary statement. The public offer must not promise anything this section excludes.

## 2. Inputs and customer access-grant model

The customer provides:

1. read access to the in-scope code by public repository URL, uploaded archive, or git bundle of the reviewed ref; and
2. a completed intake stating intended architecture, deployment target, known concerns, and the explicit scope boundary.

Access must be read-only, time-limited, and scope-limited. Review is pinned to a specific commit recorded in the report. Work performed on another ref must be identified separately and may not be represented as evidence for the pinned review.

Live production systems, customer databases, end-user data, and production credentials are not accepted as normal inputs. If credentials or secrets are discovered inside submitted code, they are reported without copying secret values into the report body, and the customer is notified promptly.

The intake or engagement record must state whether private customer materials may be processed using third-party AI services. Private source material may not be transmitted to an external model provider without explicit customer authorization and an approved handling pathway. When authorization is absent, analysis must remain inside approved local or non-retaining tooling boundaries.

## 3. Evidence requirements

Every material finding must cite evidence by one or more of the following:

- repository-relative path, commit SHA, and line range or configuration key;
- reproduced command and relevant output; or
- customer intake statement, labeled as customer-reported.

Behavioral claims require reproduction or must be classified as inference. Framework conventions may motivate investigation but may not substitute for artifact evidence.

The evidence appendix must list commands run and sources consulted sufficiently for a skeptical engineer to retrace the pass.

## 4. Statement and verification taxonomy

Every material statement must carry exactly one epistemic classification:

- **Observation:** a fact directly supported by inspected or reproduced evidence.
- **Inference:** a conclusion derived from observations, with the reasoning chain stated.
- **Opinion:** professional judgment on which reasonable reviewers could differ.
- **Risk statement:** a possible adverse outcome, including trigger condition, consequence, and evidentiary basis.

Where applicable, the statement must also record verification status:

- Reproduced
- Directly inspected
- Customer-reported
- Not reproduced
- Requires confirmation

A reproduced defect is recorded as an Observation with verification status Reproduced. Unclassified material statements block delivery.

## 5. Severity and confidence

Severity describes consequence if the condition is realized:

- Critical
- High
- Medium
- Low
- Informational

Confidence describes evidentiary certainty:

- High — directly evidenced or reproduced
- Medium — strongly supported inference
- Low — indicative but unresolved

Severity and confidence are independent. A Low-confidence item may describe potentially serious impact, but it may not be delivered as a confirmed Critical or High finding. It must be presented as a provisional risk or investigation question requiring validation.

## 6. Required report structure

1. Executive summary in plain language
2. Scope, method, reviewed commit, and time spent
3. Structural system map covering components, data flow, trust boundaries, and approval boundaries
4. Findings, each with title, epistemic classification, verification status, evidence citation, severity, confidence, and recommendation
5. Prioritized next steps, normally no more than seven
6. Service boundary statement from Section 1
7. Evidence appendix

Internal MIRRORNODE vocabulary, node names, engine names, and numeric mnemonics must not appear in customer-facing deliverables unless the customer system itself uses those terms and they are necessary to explain the reviewed artifact.

## 7. Human Operator review and signoff

An accountable human reviewer approves every delivered report and signs it using their professional name and role. The reviewer may reject, downgrade, relabel, or remove any proposed finding.

Within the capability and authority boundaries already established by applicable canon and engagement terms, AI systems may assist with evidence organization, analysis, and drafting but may not independently authorize findings, severity, publication, refusal, refund, or delivery. This sentence is an implementation constraint for this service, not an amendment to CORE-HUB authority. The method section must disclose whether AI tools were used, what role they played, and whether customer source material was transmitted to a third-party model service.

## 8. Data handling, retention, revocation, and destruction

Customer artifacts must remain inside a documented per-engagement workspace and may not be reused for unrelated analysis, training, demonstrations, or cross-customer comparison.

Active source materials and working copies must be removed no later than 30 days after delivery, or earlier upon a valid customer request. Encrypted backups and provider logs may age out according to documented retention cycles and must not be restored except for legitimate disaster recovery or security response.

Necessary payment, contractual, tax, dispute, and security records may be retained where reasonably required, but must not contain unnecessary source code or secret values.

The report is treated as customer-confidential and delivered for the customer’s use subject to the governing engagement terms. MIRRORNODE must not publish, quote, identify, or use the customer or report for marketing without written permission.

The customer may revoke access during the engagement. Further review stops immediately, active access is removed, and the cancellation boundary in Section 10 applies.

## 9. Explicit exclusions and refusal conditions

Osiris must decline when:

- the requested work requires certified review of regulated data beyond bounded structural observation;
- the customer is in an active security incident requiring incident response;
- the purpose is to validate marketing, investor, or compliance claims;
- scope cannot be bounded to one honest pass;
- authorization to review the code is unclear; or
- the customer requires guarantees excluded by Section 1.

A declined engagement is refunded in full.

## 10. Cancellation and refund boundary

Before substantive review begins, cancellation or inability to establish authorized access receives a full refund.

Once substantive review begins, refunds are limited to non-delivery, clear fulfillment failure, or an Operator-approved exception. Customer revocation stops further review immediately; the Operator determines whether to deliver completed work or issue a proportional or full refund consistently with the published terms.

The public offer, checkout language, engagement terms, and fulfillment runbook must use a compatible refund boundary before paid delivery begins.

## 11. Pilot economics disclosure

The $149 price is intentionally underpriced pilot pricing. Its purpose is to gather measured fulfillment evidence across approximately the first ten engagements, including real hours per audit, delivery quality, customer outcomes, and rework burden.

The service must not represent $149 as sustainable pricing unless measured fulfillment evidence supports that conclusion. If an honest pass cannot be delivered at a commercially defensible price, that conclusion must be reported rather than degrading the review standard.

## Revision trigger

Version 0.2 may be drafted only after:

1. one Customer Zero report is produced under this standard without self-exemption; and
2. one adversarial review of that report is completed.

The report teaches the standard, not the reverse.
