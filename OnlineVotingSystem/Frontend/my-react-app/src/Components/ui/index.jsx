// src/components/ui/index.jsx
// ─── Shared design-system primitives ────────────────────────────────────────
// All colours use CSS variables from index.css — never hardcoded.

import { Loader2 } from "lucide-react";

// ── Panel ────────────────────────────────────────────────────────────────────
export function Panel({ title, subtitle, action, children, noPad = false, className = "" }) {
    return (
        <div
            className={`rounded-xl overflow-hidden ${className}`}
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
            {(title || action) && (
                <div
                    className="flex items-center justify-between gap-3 px-[18px] py-[14px]"
                    style={{ borderBottom: "1px solid var(--border)" }}
                >
                    <div className="min-w-0">
                        {title && (
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>{title}</div>
                        )}
                        {subtitle && (
                            <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>{subtitle}</div>
                        )}
                    </div>
                    {action && <div className="flex-shrink-0">{action}</div>}
                </div>
            )}
            {noPad ? children : <div className="p-[18px]">{children}</div>}
        </div>
    );
}

// ── KpiCard ──────────────────────────────────────────────────────────────────
const ACCENT = {
    purple: { border: "rgba(124,111,247,0.15)", ico: "rgba(124,111,247,0.14)", icoC: "var(--purple)", glow: "var(--purple)" },
    cyan:   { border: "rgba(77,217,232,0.15)",  ico: "rgba(77,217,232,0.12)",  icoC: "var(--cyan)",   glow: "var(--cyan)"   },
    green:  { border: "rgba(77,202,136,0.15)",  ico: "rgba(77,202,136,0.12)",  icoC: "var(--green)",  glow: "var(--green)"  },
    pink:   { border: "rgba(247,111,184,0.15)", ico: "rgba(247,111,184,0.12)", icoC: "var(--pink)",   glow: "var(--pink)"   },
    orange: { border: "rgba(247,166,77,0.15)",  ico: "rgba(247,166,77,0.12)",  icoC: "var(--orange)", glow: "var(--orange)" },
};

export function KpiCard({ icon: Icon, value, label, badge, accent = "purple" }) {
    const a = ACCENT[accent] ?? ACCENT.purple;
    return (
        <div
            className="relative overflow-hidden rounded-xl p-[18px]"
            style={{
                background: "var(--surface)",
                border: `1px solid ${a.border}`,
                boxShadow: `0 0 40px 0 ${a.glow}1a`,
            }}
        >
            {/* glow orb */}
            <div
                className="absolute rounded-full pointer-events-none"
                style={{ top: -28, right: -18, width: 80, height: 80, background: a.glow, opacity: .08 }}
            />
            <div className="flex items-start justify-between mb-3">
                <div
                    className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: a.ico, color: a.icoC }}
                >
                    <Icon size={18} />
                </div>
                {badge && (
                    <span
                        className="text-[10.5px] font-semibold px-2 py-0.5 rounded"
                        style={{ background: "rgba(77,202,136,.12)", color: "var(--green)" }}
                    >
            {badge}
          </span>
                )}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", color: "var(--t1)" }}>
                {value}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--t2)", marginTop: 4 }}>{label}</div>
        </div>
    );
}

// ── Chip ─────────────────────────────────────────────────────────────────────
const CHIP_STYLES = {
    green:  { bg: "var(--green-d)",  color: "var(--green)",  border: "var(--green-b)" },
    purple: { bg: "var(--purple-d)", color: "var(--purple)", border: "var(--purple-b)" },
    cyan:   { bg: "var(--cyan-d)",   color: "var(--cyan)",   border: "rgba(77,217,232,.2)" },
    amber:  { bg: "var(--orange-d)", color: "var(--orange)", border: "rgba(247,166,77,.25)" },
    red:    { bg: "var(--red-d)",    color: "var(--red)",    border: "rgba(247,111,111,.25)" },
    gray:   { bg: "rgba(255,255,255,.04)", color: "var(--t3)", border: "var(--border)" },
};

export function Chip({ variant = "green", dot = false, children }) {
    const s = CHIP_STYLES[variant] ?? CHIP_STYLES.gray;
    return (
        <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
        >
      {dot && (
          <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: "currentColor" }} />
      )}
            {children}
    </span>
    );
}

// ── StatusPill ───────────────────────────────────────────────────────────────
const STATUS_MAP = {
    running:   { label: "Running",   variant: "green"  },
    draft:     { label: "Draft",     variant: "gray"   },
    closed:    { label: "Closed",    variant: "cyan"   },
    published: { label: "Published", variant: "purple" },
    stopped:   { label: "Stopped",   variant: "amber"  },
};

export function StatusPill({ status }) {
    const s = STATUS_MAP[String(status || "").toLowerCase()] ?? STATUS_MAP.draft;
    return <Chip variant={s.variant} dot>{s.label}</Chip>;
}

// ── Btn ──────────────────────────────────────────────────────────────────────
export function Btn({ variant = "ghost", size = "md", children, loading, disabled, onClick, type = "button", className = "" }) {
    const base = "inline-flex items-center justify-center gap-1.5 font-semibold rounded-[7px] transition-all cursor-pointer border-none font-[Inter]";
    // min-height values chosen so buttons visually line up with Input (40px) and
    // tall form buttons (44px) respectively — was the "verify button doesn't line
    // up with input box" complaint.
    const sizes = {
        sm: "text-[11px] px-3 py-1.5",
        md: "text-[12px] px-[14px]",
        lg: "text-[13.5px] px-6 rounded-[10px]",
    };
    const minH = { sm: 28, md: 40, lg: 44 };
    const variants = {
        ghost:   { background: "transparent", border: "1px solid var(--border)", color: "var(--t2)" },
        primary: { background: "linear-gradient(135deg,var(--purple),#9b6ff7)", color: "#fff" },
        danger:  { background: "var(--red-d)", border: "1px solid rgba(247,111,111,.3)", color: "var(--red)" },
        success: { background: "var(--green-d)", border: "1px solid var(--green-b)", color: "var(--green)" },
    };
    const v = variants[variant] ?? variants.ghost;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${base} ${sizes[size]} ${className}`}
            style={{ ...v, opacity: (disabled || loading) ? .55 : 1, minHeight: minH[size] }}
        >
            {loading ? <Loader2 size={13} className="animate-spin" /> : null}
            {children}
        </button>
    );
}

// ── FormGroup ────────────────────────────────────────────────────────────────
export function FormGroup({ label, hint, error, required, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)" }}>
                    {label}{required && <span style={{ color: "var(--red)", marginLeft: 3 }}>*</span>}
                </label>
            )}
            {children}
            {hint && !error && <div style={{ fontSize: 11, color: "var(--t3)" }}>{hint}</div>}
            {error && <div style={{ fontSize: 11, color: "var(--red)" }}>{error}</div>}
        </div>
    );
}

// ── Input ────────────────────────────────────────────────────────────────────
// min-height: 44px matches Btn size="lg" so Verify / Next buttons line up perfectly
// with the input above them (the "verify button alignment" complaint).
export function Input({ error, className = "", ...props }) {
    return (
        <input
            className={className}
            style={{
                background: "var(--surface-2)",
                border: `1px solid ${error ? "rgba(247,111,111,.4)" : "var(--border)"}`,
                borderRadius: 8,
                padding: "0 14px",
                minHeight: 44,
                color: "var(--t1)",
                fontSize: 13,
                fontFamily: "Inter, sans-serif",
                outline: "none",
                width: "100%",
                transition: "border-color .15s",
            }}
            onFocus={e => (e.target.style.borderColor = error ? "rgba(247,111,111,.7)" : "var(--purple-b)")}
            onBlur={e  => (e.target.style.borderColor = error ? "rgba(247,111,111,.4)" : "var(--border)")}
            {...props}
        />
    );
}

export function Textarea({ error, rows = 3, ...props }) {
    return (
        <textarea
            rows={rows}
            style={{
                background: "var(--surface-2)",
                border: `1px solid ${error ? "rgba(247,111,111,.4)" : "var(--border)"}`,
                borderRadius: 8,
                padding: "10px 14px",
                color: "var(--t1)",
                fontSize: 13,
                fontFamily: "Inter, sans-serif",
                outline: "none",
                width: "100%",
                resize: "vertical",
                transition: "border-color .15s",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--purple-b)")}
            onBlur={e  => (e.target.style.borderColor = error ? "rgba(247,111,111,.4)" : "var(--border)")}
            {...props}
        />
    );
}

export function Select({ error, children, ...props }) {
    return (
        <select
            style={{
                background: "var(--surface-2)",
                border: `1px solid ${error ? "rgba(247,111,111,.4)" : "var(--border)"}`,
                borderRadius: 8,
                padding: "10px 14px",
                color: "var(--t1)",
                fontSize: 13,
                fontFamily: "Inter, sans-serif",
                outline: "none",
                width: "100%",
                cursor: "pointer",
                appearance: "none",
            }}
            {...props}
        >
            {children}
        </select>
    );
}

// ── ErrorBanner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ error, onClose }) {
    if (!error) return null;
    return (
        <div
            className="rounded-[10px] px-4 py-3 flex items-start justify-between gap-3"
            style={{ background: "var(--red-d)", border: "1px solid rgba(247,111,111,.25)" }}
        >
            <div className="min-w-0">
                {error.title && (
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--red)" }}>
                        {error.title}
                        {error.status && (
                            <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(247,111,111,.6)", marginLeft: 6 }}>
                ({error.status})
              </span>
                        )}
                    </div>
                )}
                <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 3 }}>{error.message}</div>
                {error.requestId && (
                    <div style={{ fontSize: 10.5, fontFamily: "JetBrains Mono", color: "var(--t3)", marginTop: 6 }}>
                        Ref: {error.requestId}
                    </div>
                )}
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer", fontSize: 16, flexShrink: 0 }}
                >
                    ×
                </button>
            )}
        </div>
    );
}

// ── SuccessBanner ────────────────────────────────────────────────────────────
export function SuccessBanner({ title, message, onClose }) {
    return (
        <div
            className="rounded-[10px] px-4 py-3 flex items-center gap-3"
            style={{ background: "var(--green-d)", border: "1px solid var(--green-b)" }}
        >
            <span style={{ fontSize: 18, color: "var(--green)", flexShrink: 0 }}>✓</span>
            <div className="flex-1">
                {title && <div style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>{title}</div>}
                {message && <div style={{ fontSize: 11.5, color: "var(--t2)", marginTop: 2 }}>{message}</div>}
            </div>
            {onClose && (
                <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>×</button>
            )}
        </div>
    );
}

// ── InfoRow ──────────────────────────────────────────────────────────────────
export function InfoRow({ label, value, mono = false, last = false }) {
    return (
        <div
            className="flex items-center justify-between py-[10px]"
            style={{ borderBottom: last ? "none" : "1px solid var(--border)" }}
        >
            <span style={{ fontSize: 12, color: "var(--t2)" }}>{label}</span>
            <span
                style={{
                    fontSize: mono ? 11.5 : 12.5,
                    fontWeight: 600,
                    color: "var(--t1)",
                    fontFamily: mono ? "JetBrains Mono, monospace" : "inherit",
                }}
            >
        {value}
      </span>
        </div>
    );
}

// ── Steps ────────────────────────────────────────────────────────────────────
export function Steps({ steps, current }) {
    return (
        <div className="flex items-center">
            {steps.map((step, i) => {
                const state = i < current ? "done" : i === current ? "active" : "pending";
                return (
                    <div key={i} className="flex items-center">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                                style={{
                                    background: state === "done" ? "var(--green-d)" : state === "active" ? "var(--purple-d)" : "transparent",
                                    border: `1px solid ${state === "done" ? "var(--green-b)" : state === "active" ? "var(--purple-b)" : "var(--border)"}`,
                                    color: state === "done" ? "var(--green)" : state === "active" ? "var(--purple)" : "var(--t3)",
                                }}
                            >
                                {state === "done" ? "✓" : i + 1}
                            </div>
                            <span
                                style={{
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    color: state === "done" ? "var(--green)" : state === "active" ? "var(--t1)" : "var(--t3)",
                                    whiteSpace: "nowrap",
                                }}
                            >
                {step}
              </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div
                                className="mx-1"
                                style={{
                                    height: 1,
                                    width: 36,
                                    background: i < current ? "rgba(77,202,136,.4)" : "var(--border)",
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Hint box (tip/note/warning) ──────────────────────────────────────────────
export function HintBox({ type = "info", children }) {
    const styles = {
        info:    { bg: "var(--purple-d)", border: "var(--purple-b)",            color: "var(--purple)", icon: "ℹ" },
        warning: { bg: "var(--orange-d)", border: "rgba(247,166,77,.25)",        color: "var(--orange)", icon: "⚠" },
        success: { bg: "var(--green-d)",  border: "var(--green-b)",              color: "var(--green)",  icon: "✓" },
        danger:  { bg: "var(--red-d)",    border: "rgba(247,111,111,.25)",        color: "var(--red)",    icon: "!" },
    };
    const s = styles[type] ?? styles.info;
    return (
        <div
            className="rounded-[8px] px-4 py-3 flex items-start gap-2"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}
        >
            <span style={{ color: s.color, fontSize: 13, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
            <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6 }}>{children}</div>
        </div>
    );
}

// ── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, children }) {
    return (
        <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.01em" }}>{title}</h1>
                {subtitle && <p style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 4 }}>{subtitle}</p>}
            </div>
            {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
        </div>
    );
}

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, text }) {
    return (
        <div className="flex items-center justify-center gap-2 py-16" style={{ color: "var(--t2)" }}>
            <Loader2 size={size} className="animate-spin" />
            {text && <span style={{ fontSize: 13 }}>{text}</span>}
        </div>
    );
}

// ── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = "📭", title, subtitle }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div style={{ fontSize: 36, opacity: .3 }}>{icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t2)" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: "var(--t3)", textAlign: "center", maxWidth: 300 }}>{subtitle}</div>}
        </div>
    );
}

// ── ShareBar (horizontal progress bar for % values) ──────────────────────────
export function ShareBar({ pct, winner = false }) {
    return (
        <div>
            <div style={{ fontSize: 10.5, fontFamily: "JetBrains Mono", color: "var(--t2)", marginBottom: 3 }}>
                {Number(pct ?? 0).toFixed(2)}%
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,.07)", borderRadius: 2, overflow: "hidden", width: 100 }}>
                <div
                    style={{
                        height: "100%",
                        borderRadius: 2,
                        width: `${Math.min(pct ?? 0, 100)}%`,
                        background: winner
                            ? "linear-gradient(90deg, var(--purple), var(--cyan))"
                            : "rgba(255,255,255,.18)",
                    }}
                />
            </div>
        </div>
    );
}
