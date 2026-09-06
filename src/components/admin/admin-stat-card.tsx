import type { ReactNode } from "react";

export function AdminStatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <section className="rounded-panel border border-border bg-surface p-5 shadow-elevated">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-interface text-supporting font-medium text-text-secondary">
          {label}
        </p>
        <span className="flex size-9 items-center justify-center rounded-card bg-elevated text-accent-300">
          {icon}
        </span>
      </div>
      <p className="font-display text-page-title font-semibold text-text-primary">
        {value}
      </p>
      <p className="mt-1 font-interface text-caption text-text-muted">
        {detail}
      </p>
    </section>
  );
}
