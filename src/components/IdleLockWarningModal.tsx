import { useEffect, useRef } from "react";

type IdleLockWarningModalProps = {
  open: boolean;
  secondsLeft: number;
  onStayActive: () => void;
};

export function IdleLockWarningModal({
  open,
  secondsLeft,
  onStayActive,
}: IdleLockWarningModalProps) {
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => primaryRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 px-4"
      role="alertdialog"
      aria-live="assertive"
      aria-modal="true"
      aria-labelledby="idle-lock-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-amber-400/35 bg-slate-950 p-6 shadow-2xl">
        <h2 id="idle-lock-title" className="text-lg font-bold text-amber-100">
          Sesión inactiva
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Llevas un minuto sin actividad. Por seguridad, la bóveda se bloqueará en{" "}
          <span className="font-mono text-lg font-bold text-white">{secondsLeft}</span>{" "}
          {secondsLeft === 1 ? "segundo" : "segundos"}.
        </p>
        <button
          ref={primaryRef}
          type="button"
          onClick={onStayActive}
          className="mt-6 w-full rounded-xl bg-linear-to-r from-cyan-400 via-blue-500 to-violet-500 py-3 text-sm font-bold text-white"
        >
          Seguir usando la bóveda
        </button>
      </div>
    </div>
  );
}
