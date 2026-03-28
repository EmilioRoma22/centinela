type SecurityModalProps = {
  generatedKey: string;
  modalFeedback: string;
  onClose: () => void;
  onCopyAgain: () => void;
  onDownload: () => void;
};

export function SecurityModal({
  generatedKey,
  modalFeedback,
  onClose,
  onCopyAgain,
  onDownload,
}: SecurityModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-300/30 bg-slate-950 p-6 shadow-2xl">
        <h3 className="font-['Sora',ui-sans-serif,system-ui,sans-serif] text-xl font-bold text-white">
          Guarda tu llave maestra
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-200">
          Esta llave es muy importante. Sin ella no podras entrar al sistema ni ver
          tus contraseñas. Guardala muy bien y no la compartas con nadie.
        </p>
        <p className="mt-4 break-all rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-cyan-200">
          {generatedKey}
        </p>
        {modalFeedback && (
          <p className="mt-4 rounded-xl border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
            {modalFeedback}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCopyAgain}
            className="rounded-xl border border-cyan-300/40 bg-slate-900 px-4 py-2 text-sm font-semibold text-cyan-200"
          >
            Copiar nuevamente
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="rounded-xl border border-violet-300/40 bg-slate-900 px-4 py-2 text-sm font-semibold text-violet-200"
          >
            Descargar .txt
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-linear-to-r from-cyan-400 via-blue-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
