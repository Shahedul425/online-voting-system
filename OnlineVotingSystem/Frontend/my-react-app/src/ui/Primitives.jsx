import Icon from "./Icon";

export function Btn({ variant = "ghost", children, className = "", icon, ...rest }) {
  const base = "btn";
  const v = { primary: "btn-primary", navy: "btn-navy", ghost: "btn-ghost", danger: "btn-danger" }[variant] || "btn-ghost";
  return (
    <button className={`${base} ${v} ${className}`} {...rest}>
      {icon ? <Icon name={icon} className="w-4 h-4" /> : null}
      {children}
    </button>
  );
}

export function Card({ className = "", children, hover = false, onClick }) {
  return (
    <div onClick={onClick} className={`card ${hover ? "card-hover" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function Chip({ children, tone = "default", className = "" }) {
  const toneClass = {
    default: "",
    coral:   "",
  }[tone] || "";
  const style = tone === "coral" ? { background: "rgba(232,93,117,0.12)", color: "var(--coral)" } : undefined;
  return <span className={`chip ${toneClass} ${className}`} style={style}>{children}</span>;
}

export function StatusPill({ status }) {
  const map = {
    running:   { cls: "pill-running",   label: "Running",   icon: "play" },
    draft:     { cls: "pill-draft",     label: "Draft",     icon: "pencil" },
    closed:    { cls: "pill-closed",    label: "Closed",    icon: "lock" },
    published: { cls: "pill-published", label: "Published", icon: "trophy" },
    stopped:   { cls: "pill-stopped",   label: "Stopped",   icon: "square" },
  };
  const m = map[status] || { cls: "pill-draft", label: status || "—", icon: "circle" };
  return (
    <span className={`chip ${m.cls}`}>
      <Icon name={m.icon} className="w-3 h-3" />
      {m.label}
    </span>
  );
}

export function EmptyState({ icon = "inbox", title, body }) {
  return (
    <div className="card p-10 text-center">
      <div className="w-14 h-14 rounded-2xl grad-soft coral mx-auto flex items-center justify-center mb-4">
        <Icon name={icon} className="w-7 h-7" />
      </div>
      <div className="display text-lg font-semibold mb-1">{title}</div>
      <div className="ink-2 text-sm">{body}</div>
    </div>
  );
}

export function Hairline({ className = "" }) {
  return <div className={`border-t hairline ${className}`} />;
}

export function CopyButton({ text, label = "Copied", children, className = "btn btn-ghost" }) {
  const onClick = (e) => {
    const btn = e.currentTarget;
    const original = btn.innerHTML;
    try { navigator.clipboard && navigator.clipboard.writeText(text); } catch { /* noop */ }
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>${label}`;
    setTimeout(() => { btn.innerHTML = original; }, 1800);
  };
  return <button type="button" onClick={onClick} className={className}>{children}</button>;
}

export function SpinnerInline({ size = 24 }) {
  const s = { width: size, height: size, borderWidth: 2 };
  return (
    <div
      className="rounded-full border-[var(--coral)] border-t-transparent animate-spin"
      style={{ ...s, borderStyle: "solid" }}
    />
  );
}

/**
 * In-app confirm dialog. Drop-in replacement for `window.confirm()`.
 *
 * Render unconditionally and gate on `open`. Designed so the parent owns the
 * "what happens on confirm" decision; we just relay the user's choice.
 *
 * Example:
 *   const [confirm, setConfirm] = useState(null);
 *   ...
 *   <ConfirmModal
 *     open={!!confirm}
 *     title={confirm?.title}
 *     message={confirm?.message}
 *     confirmLabel={confirm?.confirmLabel}
 *     tone={confirm?.tone}
 *     icon={confirm?.icon}
 *     busy={busy}
 *     onCancel={() => setConfirm(null)}
 *     onConfirm={async () => { await confirm.onConfirm(); setConfirm(null); }}
 *   />
 */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel  = "Cancel",
  tone = "primary",       // "primary" | "navy" | "danger"
  icon,                    // optional lucide icon name shown in the header
  busy = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  const palette = {
    primary: { bg: "rgba(232,124,102,0.12)", color: "var(--coral)" },
    navy:    { bg: "rgba(43,60,95,0.10)",    color: "var(--t1)" },
    danger:  { bg: "rgba(193,69,69,0.10)",   color: "var(--err, #C14545)" },
  }[tone] || { bg: "rgba(232,124,102,0.12)", color: "var(--coral)" };

  const onBackdrop = (e) => { if (e.target === e.currentTarget && !busy) onCancel?.(); };
  const onKey      = (e) => { if (e.key === "Escape" && !busy) onCancel?.(); };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={onBackdrop}
      onKeyDown={onKey}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,31,46,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="card shadow-lift max-w-md w-full p-6 fade-in"
        style={{ borderRadius: 20 }}
        onMouseDown={e => e.stopPropagation()}
      >
        {icon && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: palette.bg, color: palette.color }}
          >
            <Icon name={icon} className="w-6 h-6" />
          </div>
        )}
        {title && (
          <div className="display text-xl font-semibold mb-1" style={{ color: "var(--t1)" }}>
            {title}
          </div>
        )}
        {message && (
          <div className="text-sm mb-5" style={{ color: "var(--t2)" }}>
            {message}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Btn variant="ghost" type="button" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Btn>
          <Btn variant={tone === "danger" ? "danger" : tone} type="button" onClick={onConfirm} disabled={busy}>
            {busy
              ? (<><Icon name="loader-2" className="w-4 h-4 animate-spin" /> Working…</>)
              : confirmLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight inline banner for surfacing errors that used to be `alert(...)`.
 * Renders nothing when `message` is falsy. Auto-dismissable when `onClose` is
 * provided.
 */
export function ErrorBanner({ message, onClose, className = "" }) {
  if (!message) return null;
  return (
    <div
      className={`flex items-start gap-2 p-3 rounded-lg ${className}`}
      style={{
        background: "rgba(193,69,69,0.08)",
        border: "1px solid rgba(193,69,69,0.20)",
        color: "var(--err, #C14545)",
      }}
    >
      <Icon name="alert-triangle" className="w-4 h-4 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="opacity-70 hover:opacity-100"
          style={{ background: "transparent", border: "none", cursor: "pointer" }}
        >
          <Icon name="x" className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
