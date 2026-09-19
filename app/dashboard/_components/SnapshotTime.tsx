"use client";

import { useSyncExternalStore } from "react";

// A fixed request timestamp, localized after hydration. No timer or subscription.
const subscribe = () => () => {};
export function SnapshotTime({ iso }: { iso: string }) {
  const label = useSyncExternalStore(
    subscribe,
    () => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "long" }),
    () => `${iso} (UTC)`,
  );
  return <time dateTime={iso}>{label}</time>;
}
