type ResetVaultModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function ResetVaultModal({ onCancel, onConfirm }: ResetVaultModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-vault-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-rose-400/30 bg-slate-950 p-6 shadow-2xl">
        <h3
          id="reset-vault-title"
          className="font-['Sora',ui-sans-serif,system-ui,sans-serif] text-lg font-bold text-white"
        >
          Reiniciar bóveda
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Si olvidaste tu llave maestra, puedes reiniciar la bóveda y crear una nueva.
          <span className="mt-2 block font-medium text-rose-200">
            Se eliminarán todas las contraseñas y datos asociados a esta bóveda en este
            dispositivo. Esta acción no se puede deshacer.
          </span>
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Más adelante podremos ofrecer recuperación segura; por ahora solo reinicio
          completo.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
          >
            Sí, reiniciar bóveda
          </button>
        </div>
      </div>
    </div>
  );
}
