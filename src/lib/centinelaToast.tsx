import type { ReactNode } from "react";
import toast, { Toaster, type Toast } from "react-hot-toast";

type ToastTone = "success" | "error" | "info";

function CentinelaToastBar({
  t,
  tone,
  message,
}: {
  t: Toast;
  tone: ToastTone;
  message: string;
}) {
  const toneStyles: Record<ToastTone, string> = {
    success:
      "border-emerald-400/35 bg-emerald-500/12 text-emerald-50 shadow-emerald-900/25",
    error: "border-rose-400/40 bg-rose-500/12 text-rose-50 shadow-rose-900/20",
    info: "border-cyan-400/35 bg-cyan-500/10 text-cyan-50 shadow-cyan-900/20",
  };

  const icons: Record<ToastTone, ReactNode> = {
    success: (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-200">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    ),
    error: (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-400/20 text-rose-200">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
    ),
    info: (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-200">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </span>
    ),
  };

  return (
    <div
      className={`
        flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md
        font-['Space_Grotesk',ui-sans-serif,system-ui,sans-serif]
        transition-all duration-300
        ${t.visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}
        ${toneStyles[tone]}
      `}
    >
      {icons[tone]}
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/55">
          Centinela
        </p>
        <p className="mt-1 text-sm leading-snug">{message}</p>
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        className="shrink-0 rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
        aria-label="Cerrar"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function push(tone: ToastTone, message: string, duration: number) {
  toast.custom((t) => <CentinelaToastBar t={t} tone={tone} message={message} />, {
    duration,
    position: "bottom-right",
  });
}

export const centinelaToast = {
  success: (message: string) => push("success", message, 4000),
  error: (message: string) => push("error", message, 5500),
  info: (message: string) => push("info", message, 3800),
};

export function CentinelaToaster() {
  return (
    <Toaster
      containerStyle={{ bottom: 24, right: 24 }}
      toastOptions={{
        duration: 4000,
        style: { background: "transparent", boxShadow: "none", padding: 0 },
      }}
    />
  );
}
