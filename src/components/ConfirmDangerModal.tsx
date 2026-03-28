import { useEffect, useRef } from "react";

type ConfirmDangerModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDangerModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  onCancel,
  onConfirm,
}: ConfirmDangerModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => cancelBtnRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/75 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-danger-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-rose-400/35 bg-slate-950 p-6 shadow-2xl">
        <h2
          id="confirm-danger-title"
          className="font-['Sora',ui-sans-serif,system-ui,sans-serif] text-xl font-bold text-white"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl border border-rose-400/50 bg-rose-500/20 px-4 py-2.5 text-sm font-semibold text-rose-100"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
