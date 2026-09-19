import styles from "../workspace.module.css";
import type { Docket } from "@/lib/operator-docket/types";
import { evidenceView, receipts } from "@/lib/operator-docket/receipts";

export function OperatorDocketCard({ docket, now }: { docket: Docket; now: number }) {
  const view = evidenceView(docket, now);
  const receipt = docket.receiptRef ? receipts[docket.receiptRef] : undefined;
  const fields = [
    ["Why am I seeing this?", docket.why],
    ["What is established?", docket.established],
    ["What is unresolved?", docket.unresolved],
    ["What decision belongs to the Operator?", docket.decision],
    ["What receipt closes the next step?", docket.nextReceipt],
    ["What does this NOT authorize?", docket.doesNotAuthorize],
  ];
  return (
    <details id={docket.id} className={styles.card} data-tone={docket.laneState === "REFERENCE" ? "reference" : view.attentionState === "HOLD" ? "hold" : "evidence"}>
      <summary className={styles.summary}>
        <h3 className={styles.cardTitle}>{docket.title}</h3>
        <p className={styles.condition}>{docket.summary}</p>
        <span className={styles.chips}>
          <span className={styles.chip} data-state={view.attentionState}><span className={styles.srOnly}>Attention: </span>{view.attentionState}</span>
          <span className={styles.chip} data-state={docket.laneState}><span className={styles.srOnly}>Lane: </span>{docket.laneState}</span>
          <span className={styles.chip} data-state={view.evidenceState}><span className={styles.srOnly}>Evidence: </span>{view.evidenceState}</span>
        </span>
        <span className={styles.toggle}><span className={styles.openLabel}>Open docket</span><span className={styles.closeLabel}>Close docket</span><span aria-hidden="true"> ↗</span></span>
      </summary>
      {view.evidenceState !== "CURRENT" && (
        <p className={styles.warning}>
          Evidence requires review. Historical claims below do not establish current readiness.
        </p>
      )}
      <dl className={styles.fields}>
        {fields.map(([label, value]) => <div key={label}><dt >{label}</dt><dd >{value}</dd></div>)}
      </dl>
      <div className={styles.provenance}>
        <p>Curated by: {docket.source}</p>
        <p>Receipt: {receipt?.path ?? "NOT OBSERVED — no deployment receipt attached"}</p>
        <p>Receipt scope: {receipt?.scope ?? "Reported context only"}</p>
        <p>Evidence observed (UTC): {docket.evidenceObservedAt ?? "UNKNOWN"}</p>
        <p>Review by (UTC): {receipt?.reviewBy ?? "Before any readiness claim"}</p>
        <p>Superseded by: {receipt?.supersededBy ?? "None recorded"}</p>
        <p>Operator acknowledgement: {docket.operatorAcknowledgedAt && docket.operatorAcknowledgementRef
          ? `${docket.operatorAcknowledgedAt} — ${docket.operatorAcknowledgementRef}` : "PENDING — receipt existence is not acknowledgement"}</p>
        <p>Repository document: <code>{docket.document}</code></p>
        <p>Opening this card records no decision and executes no action.</p>
      </div>
    </details>
  );
}
