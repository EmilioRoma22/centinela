import { useEffect, useId, useRef, type MouseEvent } from "react";
import { VaultFolder } from "../types/vault";

type DashboardFoldersDrawerProps = {
  open: boolean;
  onClose: () => void;
  folders: VaultFolder[];
  selectedFolderId: string;
  onSelectFolder: (folderId: string) => void;
  onRequestDeleteFolder: (folder: VaultFolder) => void;
};

function TrashIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

export function DashboardFoldersDrawer({
  open,
  onClose,
  folders,
  selectedFolderId,
  onSelectFolder,
  onRequestDeleteFolder,
}: DashboardFoldersDrawerProps) {
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => closeBtnRef.current?.focus());
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

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-55 lg:hidden"
      role="presentation"
      onMouseDown={handleBackdropMouseDown}
    >
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-md backdrop-saturate-150" aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute left-0 top-0 flex h-full w-[min(100%,18.5rem)] flex-col border-r border-slate-700/80 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur-md"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-700/80 px-3 py-3">
          <h2 id={titleId} className="font-['Sora',ui-sans-serif,system-ui,sans-serif] text-base font-bold text-white">
            Apartados
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Cerrar menú de apartados"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
          {folders.map((folder) => {
            const isSelected = selectedFolderId === folder.id;
            const canDeleteFolder = folder.credentials.length === 0;
            return (
              <div
                key={folder.id}
                className={`flex items-stretch gap-1 rounded-xl border transition ${
                  isSelected
                    ? "border-cyan-400/50 bg-cyan-500/15"
                    : "border-transparent bg-slate-900/40 hover:border-slate-600/80 hover:bg-slate-900/70"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectFolder(folder.id);
                    onClose();
                  }}
                  className="min-w-0 flex-1 px-3 py-2.5 text-left text-slate-200"
                >
                  <p className="font-semibold text-white">{folder.name}</p>
                  <p className="text-xs text-slate-400">{folder.credentials.length} credencial(es)</p>
                </button>
                {canDeleteFolder && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRequestDeleteFolder(folder);
                    }}
                    className="shrink-0 rounded-lg border border-transparent px-2 text-slate-500 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-200"
                    title="Eliminar apartado vacío"
                    aria-label={`Eliminar apartado vacío ${folder.name}`}
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
