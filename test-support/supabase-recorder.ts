/**
 * A recording stand-in for the parts of supabase-js the Osiris routes use.
 * Every `from(table)` call becomes one recorded operation with its filter
 * chain, and every `rpc(name, args)` call one operation with its arguments
 * (table = function name, payload = args), so tests can assert exactly which
 * conditional writes and function calls were sent.
 * Results come from a queue, in call order; unqueued calls succeed with no rows.
 */

export type RecordedOp = {
  table: string;
  kind: 'upsert' | 'update' | 'insert' | 'select' | 'rpc';
  payload?: unknown;
  options?: unknown;
  filters: Array<[string, ...unknown[]]>;
  selected: boolean;
};

type Result = { data?: unknown; error?: { message: string } | null };

export function createSupabaseRecorder() {
  const ops: RecordedOp[] = [];
  const results: Result[] = [];

  function builder(op: RecordedOp) {
    const resolveResult = () => {
      const r = results.shift() ?? {};
      return { data: r.data ?? (op.selected ? [] : null), error: r.error ?? null };
    };
    const b: Record<string, unknown> = {};
    for (const m of ['eq', 'neq', 'in', 'not', 'is', 'or']) {
      b[m] = (...args: unknown[]) => {
        op.filters.push([m, ...args]);
        return b;
      };
    }
    b.select = () => {
      op.selected = true;
      return b;
    };
    b.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(resolveResult()).then(resolve, reject);
    return b;
  }

  const client = {
    rpc(name: string, args?: unknown) {
      const op: RecordedOp = { table: name, kind: 'rpc', payload: args, filters: [], selected: true };
      ops.push(op);
      return builder(op);
    },
    from(table: string) {
      const start = (kind: RecordedOp['kind'], payload?: unknown, options?: unknown) => {
        const op: RecordedOp = { table, kind, payload, options, filters: [], selected: false };
        ops.push(op);
        return builder(op);
      };
      return {
        upsert: (payload: unknown, options?: unknown) => start('upsert', payload, options),
        update: (payload: unknown) => start('update', payload),
        insert: (payload: unknown) => start('insert', payload),
        select: () => start('select'),
      };
    },
  };

  return {
    client,
    ops,
    /** Queue the next results, one per database call, in order. */
    queue(...next: Result[]) {
      results.push(...next);
    },
    reset() {
      ops.length = 0;
      results.length = 0;
    },
  };
}
