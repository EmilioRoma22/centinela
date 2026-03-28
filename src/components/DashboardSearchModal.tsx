import { useEffect, useId, useRef, type MouseEvent } from "react";
import { VaultCredential } from "../types/vault";

export type DashboardSearchHit = {
  folderId: string;
  folderName: string;
  credential: VaultCredential;
};

type DashboardSearchModalProps = {
  open: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchHits: DashboardSearchHit[];
  onPickHit: (hit: DashboardSearchHit) => void;
};

function SearchIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export function DashboardSearchModal({
  open,
  onClose,
  searchQuery,
  onSearchQueryChange,
  searchHits,
  onPickHit,
}: DashboardSearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
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
      className="fixed inset-0 z-60 flex items-start justify-center px-3 pt-[min(12vh,5rem)] sm:pt-[15vh]"
      role="presentation"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xl backdrop-saturate-150"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-600/70 bg-slate-950/90 p-4 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-md"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="sr-only">
          Buscar credenciales
        </h2>
        <label htmlFor="dashboard-search-modal-input" className="sr-only">
          Búsqueda global en todas las credenciales
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <SearchIcon />
          </div>
          <input
            ref={inputRef}
            id="dashboard-search-modal-input"
            type="search"
            autoComplete="off"
            placeholder="Buscar cuenta, correo, usuario…"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.currentTarget.value)}
            className="w-full rounded-xl border border-slate-600/80 bg-slate-900/95 py-3 pl-10 pr-11 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Cerrar búsqueda"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-3 max-h-[min(50vh,24rem)] overflow-y-auto rounded-xl border border-slate-700/60 bg-slate-900/40">
          {searchHits.length > 0 ? (
            searchHits.map((hit) => (
              <button
                key={`${hit.folderId}-${hit.credential.id}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPickHit(hit)}
                className="flex w-full flex-col gap-0.5 border-b border-slate-800/80 px-4 py-3 text-left last:border-0 hover:bg-slate-800/80"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-cyan-300/90">
                  Apartado · {hit.folderName}
                </span>
                <span className="font-semibold text-white">{hit.credential.title}</span>
                <span data-context-copy="user-email" className="select-text break-all text-sm text-slate-400">
                  {hit.credential.username}
                </span>
              </button>
            ))
          ) : searchQuery.trim().length > 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              Ninguna credencial coincide con «{searchQuery.trim()}».
            </p>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              Escribe para filtrar por título o usuario en todos los apartados.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
