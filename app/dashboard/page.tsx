import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Sans, IBM_Plex_Mono, Newsreader } from "next/font/google";
import { SnapshotTime } from "./_components/SnapshotTime";
import styles from "./workspace.module.css";

const sans = IBM_Plex_Sans({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--hud-sans", display: "swap" });
const mono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--hud-mono", display: "swap" });
const display = Newsreader({ subsets: ["latin"], variable: "--hud-display", display: "swap" });
import { dockets } from "@/lib/operator-docket/dockets";
import { OperatorDocketCard } from "./_components/OperatorDocketCard";

// Evaluate evidence age at request time, never freeze readiness into a build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operator Workspace — MIRRORNODE",
  description:
    "A bounded MIRRORNODE operating surface for navigating verified capabilities and work lanes.",
  robots: {
    index: false,
    follow: false,
  },
};

const lanes = [
  {
    title: "Osiris Audit",
    description:
      "Customer-facing structural audit flow: offer, checkout, verified intake, and controlled fulfillment.",
    href: "/osiris-audit",
    action: "Open audit surface",
  },
  {
    title: "AI Nodes",
    description:
      "Navigate the current node-facing surfaces without presenting inferred runtime state as telemetry.",
    href: "/agents",
    action: "Open node directory",
  },
  {
    title: "Librarian",
    description:
      "Knowledge and document-oriented working surface for material that belongs inside MIRRORNODE.",
    href: "/workspace/files",
    action: "Open librarian",
  },
  {
    title: "Runtime Readiness",
    description:
      "Read the application readiness endpoint directly. Its response is runtime evidence, not a decorative status.",
    href: "/api/health/ready",
    action: "Read health evidence",
  },
];

const buildTargets = [
  "Client intake and case work",
  "File intake, organization, and export",
  "Direct node-assisted work surfaces",
  "Osiris case operation and delivery",
  "Operator legal and administrative workspace",
];

// Server request clock, isolated from component rendering; force-dynamic prevents caching.
function requestTime() {
  return Date.now();
}

export default function Dashboard() {
  const now = requestTime();
  return (
    <div className={`${styles.workspace} ${sans.variable} ${mono.variable} ${display.variable}`}>
      <a href="#workspace-main" className={styles.skip}>Skip to workspace</a>
      <header className={styles.header}>
        <Link href="/" prefetch={false} className={styles.mark}>[ MIRRORNODE ]</Link>
        <span className={styles.eyebrow}>Working surface · evidence bounded</span>
        <span className={styles.seal}>Presentation is not authority</span>
      </header>
      <div className={styles.layout}>
        <nav aria-label="Workspace surfaces" className={styles.rail}>
          <p className={styles.eyebrow}>Surfaces</p>
          <a href="#docket" className={styles.selected}>Operator docket</a>
          {lanes.map(lane => <Link prefetch={false} key={lane.title} href={lane.href}>{lane.title}</Link>)}
          <a href="#prospect-radar">Prospect Radar <span>HOLD · docket only</span></a>
          <p className={styles.railNote}>Open a surface to inspect its evidence. Placement does not establish readiness.</p>
        </nav>
        <main id="workspace-main" className={styles.main}>
          <section className={styles.intro} aria-labelledby="workspace-heading">
            <p className={styles.eyebrow}>Operator workspace</p>
            <h1 id="workspace-heading">Work from what the system can actually establish.</h1>
            <p>Declared attention, bounded evidence, explicit next steps.</p>
          </section>
          <section id="docket" aria-labelledby="operator-docket-heading" className={styles.docket}>
            <div className={styles.sectionHeading}><h2 id="operator-docket-heading">Operator docket</h2><span className={styles.eyebrow}>Curated attention</span></div>
            <p className={styles.description}>Commercial evidence, Radar review, then the frozen workspace reference. Opening a card records no decision.</p>
            <div className={styles.cards}>
              {dockets.map(docket => <OperatorDocketCard key={docket.id} docket={docket} now={now} />)}
            </div>
          </section>
          <aside aria-labelledby="bound-heading" className={styles.bound}>
            <p className={styles.eyebrow}>Operating bound</p>
            <h2 id="bound-heading">The HUD points.<br />It does not authorize.</h2>
            <p>No inferred uptime, task counts, coherence scores, or live state. Runtime claims belong to explicit evidence surfaces.</p>
            <dl>
              <div><dt>Snapshot</dt><dd><SnapshotTime iso={new Date(now).toISOString()} /></dd></div>
              <div><dt>Freshness</dt><dd>As of page load. Reload before a decision; this page does not poll.</dd></div>
              <div><dt>Curator</dt><dd>Codex, from the Operator’s requested lanes.</dd></div>
              <div><dt>Record path</dt><dd><code>docs/operator/</code><span>Repository documents; decisions and receipts remain separate.</span></dd></div>
              <div><dt>Runtime verification</dt><dd><span className={styles.chip} data-state="UNKNOWN">UNKNOWN</span></dd></div>
            </dl>
            <p className={styles.boundFoot}>CURRENT describes a scoped receipt within its review interval. It does not establish runtime health or permission.</p>
          </aside>
          <section aria-labelledby="surfaces-heading" className={styles.surfaces}>
            <div className={styles.sectionHeading}><h2 id="surfaces-heading">Evidence surfaces</h2><span className={styles.eyebrow}>Open to inspect</span></div>
            <div className={styles.tiles}>
              {lanes.map(lane => (
                <article key={lane.title} className={styles.tile}>
                  <h3>{lane.title}</h3>
                  <p>{lane.description}</p>
                  <div className={styles.empty}>No runtime observation loaded here.</div>
                  <Link prefetch={false} href={lane.href}>{lane.action} <span aria-hidden="true">↗</span></Link>
                </article>
              ))}
            </div>
          </section>
          <section className={styles.direction} aria-labelledby="direction-heading">
            <p className={styles.eyebrow}>Build direction · targets only</p>
            <h2 id="direction-heading">One workspace, progressively connected.</h2>
            <p>Implementation targets become active only when their underlying state, authority, and evidence boundary is wired.</p>
            <ul>{buildTargets.map(target => <li key={target}>{target}</li>)}</ul>
          </section>
        </main>
      </div>
      <footer className={styles.footer}>MIRRORNODE · Operator workspace · No inferred live-state claims</footer>
    </div>
  );
}
