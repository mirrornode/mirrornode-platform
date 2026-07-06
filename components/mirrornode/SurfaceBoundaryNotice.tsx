type SurfaceBoundaryNoticeProps = {
  children: React.ReactNode;
  tone?: "default" | "warning";
};

export function SurfaceBoundaryNotice({ children, tone = "default" }: SurfaceBoundaryNoticeProps) {
  return (
    <div
      className={[
        "rounded-lg border px-4 py-3 text-sm leading-relaxed",
        tone === "warning"
          ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
          : "border-cyan-300/20 bg-cyan-300/10 text-cyan-50/80",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
