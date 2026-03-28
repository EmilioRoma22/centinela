import { useEffect, useRef, SubmitEvent } from "react";

type CreateFolderModalProps = {
  open: boolean;
  name: string;
  onNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => boolean;
};

export function CreateFolderModal({
  open,
  name,
  onNameChange,
  onClose,
  onSubmit,
}: CreateFolderModalProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      firstInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleFormSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onSubmit()) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-folder-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-950 p-6 shadow-2xl">
        <h2
          id="modal-folder-title"
          className="font-['Sora',ui-sans-serif,system-ui,sans-serif] text-xl font-bold text-white"
        >
          Nuevo apartado
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Organiza tus credenciales por categoría (Redes sociales, Programación, etc.).
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleFormSubmit}>
          <div>
            <label htmlFor="modal-folder-name" className="text-xs text-slate-400">
              Nombre del apartado
            </label>
            <input
              ref={firstInputRef}
              id="modal-folder-name"
              value={name}
              onChange={(event) => onNameChange(event.currentTarget.value)}
              placeholder="Ej. Redes sociales"
              className="mt-1 w-full rounded-xl border border-slate-600/80 bg-slate-900/90 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-linear-to-r from-cyan-400 via-blue-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Crear apartado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
