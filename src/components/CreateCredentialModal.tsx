import { useEffect, useRef } from "react";
import type { SubmitEvent } from "react";

type CreateCredentialModalProps = {
  open: boolean;
  title: string;
  username: string;
  password: string;
  onTitleChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => boolean;
  onGenerateSecurePassword: () => Promise<void>;
};

export function CreateCredentialModal({
  open,
  title,
  username,
  password,
  onTitleChange,
  onUsernameChange,
  onPasswordChange,
  onClose,
  onSubmit,
  onGenerateSecurePassword,
}: CreateCredentialModalProps) {
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
      aria-labelledby="modal-credential-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/80 bg-slate-950 p-6 shadow-2xl">
        <h2
          id="modal-credential-title"
          className="font-['Sora',ui-sans-serif,system-ui,sans-serif] text-xl font-bold text-white"
        >
          Nueva credencial
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Se guardará en el apartado que tengas seleccionado en el panel lateral.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleFormSubmit}>
          <div>
            <label htmlFor="modal-cred-title" className="text-xs text-slate-400">
              Cuenta o servicio
            </label>
            <input
              ref={firstInputRef}
              id="modal-cred-title"
              value={title}
              onChange={(event) => onTitleChange(event.currentTarget.value)}
              placeholder="GitHub, Netflix..."
              className="mt-1 w-full rounded-xl border border-slate-600/80 bg-slate-900/90 px-4 py-3 text-lg text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="modal-cred-user" className="text-xs text-slate-400">
              Usuario o correo
            </label>
            <input
              id="modal-cred-user"
              value={username}
              onChange={(event) => onUsernameChange(event.currentTarget.value)}
              placeholder="email@ejemplo.com"
              className="mt-1 w-full rounded-xl border border-slate-600/80 bg-slate-900/90 px-4 py-3 text-lg text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="modal-cred-pass" className="text-xs text-slate-400">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => void onGenerateSecurePassword()}
                className="text-sm font-semibold text-cyan-400 hover:text-cyan-300"
              >
                Generar contraseña segura
              </button>
            </div>
            <input
              id="modal-cred-pass"
              type="password"
              autoComplete="off"
              value={password}
              onChange={(event) => onPasswordChange(event.currentTarget.value)}
              placeholder="Ingresa una contraseña segura o genera una"
              className="mt-1 w-full rounded-xl border border-slate-600/80 bg-slate-900/90 px-4 py-3 font-mono text-lg text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
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
              Guardar credencial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
