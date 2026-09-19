import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OperatorDocketCard } from "./OperatorDocketCard";
import { dockets } from "@/lib/operator-docket/dockets";

describe("docket presentation", () => {
  it("renders all three native disclosure cards with provenance and boundaries", () => {
    const html = dockets.map(docket => renderToStaticMarkup(<OperatorDocketCard docket={docket} now={Date.parse("2026-09-18T04:00:00Z")} />)).join("");
    expect(html.match(/<details/g)).toHaveLength(3);
    for (const docket of dockets) expect(html).toContain(docket.title);
    expect(html.match(/Operator acknowledgement:/g)).toHaveLength(3);
    expect(html.match(/What does this NOT authorize/g)).toHaveLength(3);
    expect(html).not.toContain("<button");
    expect(html).not.toContain("<form");
  });
  it("shows stale warning instead of a ready attention state", () => {
    const docket = { ...dockets[2], attentionState: "READY_FOR_DECISION" as const };
    const html = renderToStaticMarkup(<OperatorDocketCard docket={docket} now={Date.parse("2026-09-20T00:00:00Z")} />);
    expect(html).toContain("STALE");
    expect(html).toContain("NEEDS_EVIDENCE");
    expect(html).not.toContain("READY_FOR_DECISION");
    expect(html).toContain("Historical claims below do not establish current readiness");
  });
  it("does not display acknowledgement from a timestamp without a receipt", () => {
    const docket = { ...dockets[2], operatorAcknowledgedAt: "2026-09-18T04:00:00Z" };
    expect(renderToStaticMarkup(<OperatorDocketCard docket={docket} now={Date.parse("2026-09-18T04:00:00Z")} />)).toContain("PENDING");
  });
});
