'use client';

/**
 * OSIRIS — Node 4 Live State Page
 * /osiris
 *
 * Fetches /api/state/osiris on load and on SYNC trigger.
 * Displays raw JSON state + sends POST /api/event on button press.
 * This page IS the visible proof that the MIRRORNODE ↔ OSIRIS link is real.
 */

import { useEffect, useRef, useState } from 'react';

type OsirisState = Record<string, unknown> | null;

export default function OsirisPage() {
  const [state, setState]       = useState<OsirisState>(null);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [syncing, setSyncing]   = useState(false);
  const pollRef                 = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch state ────────────────────────────────────────────────────────────
  async function fetchState() {
    setLoading(true);
    try {
      const res  = await fetch('/api/state/osiris');
      const data = await res.json();
      setState(data);
      log(`[${ts()}] STATE fetched — status: ${data.status ?? '?'}`);
    } catch (err) {
      log(`[${ts()}] ERROR fetching state: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  // ── Send SYNC event ────────────────────────────────────────────────────────
  async function sendSync() {
    setSyncing(true);
    try {
      const res = await fetch('/api/event', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          node:    'osiris',
          type:    'operator_action',
          payload: { action: 'sync_request' },
        }),
      });
      const data = await res.json();
      log(`[${ts()}] SYNC sent → result: ${data.result ?? 'ack'}`);
      // Immediately refresh state after sync
      await fetchState();
    } catch (err) {
      log(`[${ts()}] ERROR on sync: ${String(err)}`);
    } finally {
      setSyncing(false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function ts() {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
  }

  function log(msg: string) {
    setEventLog((prev) => [msg, ...prev].slice(0, 50));
  }

  // ── Mount: initial fetch + 10s poll ───────────────────────────────────────
  useEffect(() => {
    fetchState();
    pollRef.current = setInterval(fetchState, 10_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.nodeTag}>NODE 4</span>
          <h1 style={styles.title}>OSIRIS</h1>
          <span style={styles.subtitle}>MIRRORNODE ↔ OSIRIS LINK</span>
        </div>
        <div style={styles.headerRight}>
          <div style={{
            ...styles.statusDot,
            background: state ? '#00ff88' : '#ff4444',
          }} />
          <span style={styles.statusLabel}>
            {state ? 'LINKED' : 'UNLINKED'}
          </span>
        </div>
      </header>

      {/* Controls */}
      <section style={styles.controls}>
        <button
          onClick={fetchState}
          disabled={loading}
          style={{ ...styles.btn, ...styles.btnSecondary }}
        >
          {loading ? 'FETCHING…' : '↻ REFRESH'}
        </button>
        <button
          onClick={sendSync}
          disabled={syncing}
          style={{ ...styles.btn, ...styles.btnPrimary }}
        >
          {syncing ? 'SYNCING…' : '⚡ SYNC'}
        </button>
        <span style={styles.pollNote}>auto-poll every 10s</span>
      </section>

      {/* State Panel */}
      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <span style={styles.panelLabel}>GET /api/state/osiris</span>
          <span style={styles.panelMeta}>
            {state
              ? `last_sync: ${String((state as Record<string,unknown>)?._meta?.timestamp ?? '—')}`
              : 'awaiting…'}
          </span>
        </div>
        <pre style={styles.json}>
          {state
            ? JSON.stringify(state, null, 2)
            : loading
            ? '// fetching…'
            : '// no data'}
        </pre>
      </section>

      {/* Event Log */}
      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <span style={styles.panelLabel}>EVENT LOG</span>
          <span style={styles.panelMeta}>{eventLog.length} events</span>
        </div>
        <div style={styles.log}>
          {eventLog.length === 0 ? (
            <span style={styles.logEmpty}>// no events yet</span>
          ) : (
            eventLog.map((e, i) => (
              <div key={i} style={styles.logLine}>{e}</div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

// ── Styles (inline — no CSS file dependency) ─────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight:       '100vh',
    background:      '#0a0a0a',
    color:           '#e0e0e0',
    fontFamily:      'monospace',
    padding:         '2rem',
    display:         'flex',
    flexDirection:   'column',
    gap:             '1.5rem',
    maxWidth:        '900px',
    margin:          '0 auto',
  },
  header: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    borderBottom:   '1px solid #222',
    paddingBottom:  '1rem',
  },
  headerLeft: {
    display:    'flex',
    alignItems: 'center',
    gap:        '1rem',
  },
  nodeTag: {
    fontSize:        '0.65rem',
    letterSpacing:   '0.15em',
    color:           '#555',
    border:          '1px solid #333',
    padding:         '2px 6px',
    borderRadius:    '3px',
  },
  title: {
    fontSize:      '1.5rem',
    fontWeight:    700,
    letterSpacing: '0.1em',
    color:         '#fff',
    margin:        0,
  },
  subtitle: {
    fontSize:      '0.7rem',
    color:         '#444',
    letterSpacing: '0.08em',
  },
  headerRight: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.5rem',
  },
  statusDot: {
    width:        '8px',
    height:       '8px',
    borderRadius: '50%',
  },
  statusLabel: {
    fontSize:      '0.7rem',
    letterSpacing: '0.12em',
    color:         '#888',
  },
  controls: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.75rem',
  },
  btn: {
    padding:       '0.5rem 1.25rem',
    border:        'none',
    borderRadius:  '4px',
    fontSize:      '0.75rem',
    fontFamily:    'monospace',
    letterSpacing: '0.08em',
    cursor:        'pointer',
    fontWeight:    600,
    transition:    'opacity 0.15s',
  },
  btnPrimary: {
    background: '#00ff88',
    color:      '#000',
  },
  btnSecondary: {
    background: '#1a1a1a',
    color:      '#888',
    border:     '1px solid #333',
  },
  pollNote: {
    fontSize:  '0.65rem',
    color:     '#333',
    marginLeft: '0.25rem',
  },
  panel: {
    border:       '1px solid #1e1e1e',
    borderRadius: '6px',
    overflow:     'hidden',
  },
  panelHeader: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    background:     '#111',
    padding:        '0.5rem 1rem',
    borderBottom:   '1px solid #1e1e1e',
  },
  panelLabel: {
    fontSize:      '0.65rem',
    letterSpacing: '0.12em',
    color:         '#555',
  },
  panelMeta: {
    fontSize: '0.6rem',
    color:    '#333',
  },
  json: {
    margin:     0,
    padding:    '1rem',
    fontSize:   '0.8rem',
    lineHeight: 1.6,
    color:      '#00ff88',
    background: '#0d0d0d',
    overflowX:  'auto',
    whiteSpace: 'pre-wrap',
    wordBreak:  'break-all',
  },
  log: {
    padding:   '0.75rem 1rem',
    maxHeight: '200px',
    overflowY: 'auto',
    background: '#0d0d0d',
    display:    'flex',
    flexDirection: 'column',
    gap:        '0.25rem',
  },
  logLine: {
    fontSize:  '0.72rem',
    color:     '#666',
    fontFamily: 'monospace',
  },
  logEmpty: {
    fontSize: '0.7rem',
    color:    '#333',
  },
};
