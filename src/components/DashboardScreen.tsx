import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { invoke } from "@tauri-apps/api/core";
import { useIdleSessionLock } from "../hooks/useIdleSessionLock";
import { centinelaToast } from "../lib/centinelaToast";
import { VaultCredential, VaultFolder } from "../types/vault";
import centinelaLogoUrl from "../assets/centinela_logo.svg";
import { writeClipboardText } from "../utils/clipboard";
import { CreateCredentialModal } from "./CreateCredentialModal";
import { ConfirmDangerModal } from "./ConfirmDangerModal";
import { CreateFolderModal } from "./CreateFolderModal";
import { DashboardFoldersDrawer } from "./DashboardFoldersDrawer";
import { DashboardSearchModal, type DashboardSearchHit } from "./DashboardSearchModal";
import { EditCredentialModal } from "./EditCredentialModal";
import { IdleLockWarningModal } from "./IdleLockWarningModal";
import { LockVaultModal } from "./LockVaultModal";

type DashboardScreenProps = {
  folders: VaultFolder[];
  selectedFolderId: string;
  selectedFolder: VaultFolder | null;
  newFolderName: string;
  newCredentialTitle: string;
  newCredentialUsername: string;
  newCredentialPassword: string;
  editCredentialOpen: boolean;
  editCredentialTitle: string;
  editCredentialUsername: string;
  editCredentialPassword: string;
  onFolderNameChange: (value: string) => void;
  onCredentialTitleChange: (value: string) => void;
  onCredentialUsernameChange: (value: string) => void;
  onCredentialPasswordChange: (value: string) => void;
  onEditTitleChange: (value: string) => void;
  onEditUsernameChange: (value: string) => void;
  onEditPasswordChange: (value: string) => void;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: () => boolean;
  onCreateCredential: () => boolean;
  onStartEditCredential: (credential: VaultCredential) => void;
  onCloseEditCredential: () => void;
  onUpdateCredential: () => boolean;
  onDeleteCredential: (credentialId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onLockSession: () => void;
  onIdleLock: () => void;
  onGenerateSecureCredentialPassword: () => Promise<void>;
  onGenerateSecureEditPassword: () => Promise<void>;
};

const REVEAL_AUTO_HIDE_MS = 7000;

const IDLE_MS = 60_000;
const IDLE_WARNING_SEC = 10;

type ConfirmTarget =
  | { kind: "credential"; credential: VaultCredential }
  | { kind: "folder"; folder: VaultFolder };

function SearchIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 5a2 2 0 012-2h4a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"
      />
    </svg>
  );
}

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

function PencilIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
      />
    </svg>
  );
}

function maskPassword(length: number) {
  const n = Math.max(8, Math.min(length, 24));
  return "\u2022".repeat(n);
}

export function DashboardScreen({
  folders,
  selectedFolderId,
  selectedFolder,
  newFolderName,
  newCredentialTitle,
  newCredentialUsername,
  newCredentialPassword,
  editCredentialOpen,
  editCredentialTitle,
  editCredentialUsername,
  editCredentialPassword,
  onFolderNameChange,
  onCredentialTitleChange,
  onCredentialUsernameChange,
  onCredentialPasswordChange,
  onEditTitleChange,
  onEditUsernameChange,
  onEditPasswordChange,
  onSelectFolder,
  onCreateFolder,
  onCreateCredential,
  onStartEditCredential,
  onCloseEditCredential,
  onUpdateCredential,
  onDeleteCredential,
  onDeleteFolder,
  onLockSession,
  onIdleLock,
  onGenerateSecureCredentialPassword,
  onGenerateSecureEditPassword,
}: DashboardScreenProps) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => new Set());
  const [revealUntil, setRevealUntil] = useState<Record<string, number>>({});
  const [revealCountdownTick, setRevealCountdownTick] = useState(0);
  const autoHideTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [credentialModalOpen, setCredentialModalOpen] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [sensitiveVerifiedThisSession, setSensitiveVerifiedThisSession] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [jumpToCredentialId, setJumpToCredentialId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [foldersDrawerOpen, setFoldersDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const searchAreaRef = useRef<HTMLDivElement>(null);

  const { showWarning: idleWarningOpen, secondsLeft: idleSecondsLeft, stayActive } =
    useIdleSessionLock({
      idleMs: IDLE_MS,
      warningSeconds: IDLE_WARNING_SEC,
      enabled: true,
      onLock: onIdleLock,
    });

  const clearAutoHideTimer = useCallback((credentialId: string) => {
    const t = autoHideTimersRef.current.get(credentialId);
    if (t !== undefined) {
      clearTimeout(t);
      autoHideTimersRef.current.delete(credentialId);
    }
  }, []);

  const hideCredentialReveal = useCallback(
    (credentialId: string) => {
      clearAutoHideTimer(credentialId);
      setRevealUntil((prev) => {
        if (!(credentialId in prev)) return prev;
        const next = { ...prev };
        delete next[credentialId];
        return next;
      });
      setRevealedIds((prev) => {
        if (!prev.has(credentialId)) return prev;
        const next = new Set(prev);
        next.delete(credentialId);
        return next;
      });
    },
    [clearAutoHideTimer]
  );

  const scheduleAutoHide = useCallback(
    (credentialId: string) => {
      clearAutoHideTimer(credentialId);
      const until = Date.now() + REVEAL_AUTO_HIDE_MS;
      setRevealUntil((prev) => ({ ...prev, [credentialId]: until }));
      const t = window.setTimeout(() => {
        autoHideTimersRef.current.delete(credentialId);
        hideCredentialReveal(credentialId);
      }, REVEAL_AUTO_HIDE_MS);
      autoHideTimersRef.current.set(credentialId, t);
    },
    [clearAutoHideTimer, hideCredentialReveal]
  );

  const ensureSensitiveAccess = useCallback(async (): Promise<boolean> => {
    if (sensitiveVerifiedThisSession) return true;
    const loadingId = toast.loading("Confirmando identidad en el sistema…");
    try {
      await invoke("verify_user_presence");
      toast.dismiss(loadingId);
      setSensitiveVerifiedThisSession(true);
      centinelaToast.info(
        "Identidad verificada. Puedes ver, copiar y editar credenciales hasta que bloquees la sesión."
      );
      return true;
    } catch (error) {
      toast.dismiss(loadingId);
      centinelaToast.error(String(error));
      return false;
    }
  }, [sensitiveVerifiedThisSession]);

  const handleRevealClick = async (credentialId: string) => {
    const willReveal = !revealedIds.has(credentialId);
    if (!willReveal) {
      hideCredentialReveal(credentialId);
      return;
    }
    if (!(await ensureSensitiveAccess())) return;
    setRevealedIds((prev) => new Set(prev).add(credentialId));
    scheduleAutoHide(credentialId);
  };

  useEffect(() => {
    const hasAny = Object.keys(revealUntil).length > 0;
    if (!hasAny) return;
    const id = window.setInterval(() => setRevealCountdownTick((x) => x + 1), 250);
    return () => clearInterval(id);
  }, [revealUntil]);

  useEffect(() => {
    return () => {
      autoHideTimersRef.current.forEach((t) => clearTimeout(t));
      autoHideTimersRef.current.clear();
    };
  }, []);

  const copyPassword = async (credential: VaultCredential) => {
    if (!(await ensureSensitiveAccess())) return;
    try {
      await writeClipboardText(credential.password);
      centinelaToast.success(`Copiado al portapapeles: ${credential.title}`);
    } catch {
      centinelaToast.error("No se pudo copiar al portapapeles.");
    }
  };

  const searchHits = useMemo((): DashboardSearchHit[] => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const out: DashboardSearchHit[] = [];
    for (const folder of folders) {
      for (const c of folder.credentials) {
        if (c.title.toLowerCase().includes(q) || c.username.toLowerCase().includes(q)) {
          out.push({ folderId: folder.id, folderName: folder.name, credential: c });
        }
      }
    }
    return out.slice(0, 40);
  }, [folders, searchQuery]);

  useEffect(() => {
    const onDocDown = (event: MouseEvent) => {
      const el = searchAreaRef.current;
      if (!el) return;
      if (window.getComputedStyle(el).display === "none") return;
      if (!el.contains(event.target as Node)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  useEffect(() => {
    if (!jumpToCredentialId) return;
    const scrollT = window.setTimeout(() => {
      document
        .getElementById(`credential-${jumpToCredentialId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    const clearT = window.setTimeout(() => setJumpToCredentialId(null), 6000);
    return () => {
      window.clearTimeout(scrollT);
      window.clearTimeout(clearT);
    };
  }, [jumpToCredentialId, selectedFolderId]);

  const pickSearchHit = (hit: DashboardSearchHit) => {
    onSelectFolder(hit.folderId);
    setSearchQuery("");
    setJumpToCredentialId(hit.credential.id);
    setSearchModalOpen(false);
  };

  const handleEditClick = async (credential: VaultCredential) => {
    if (!(await ensureSensitiveAccess())) return;
    onStartEditCredential(credential);
  };

  const requestDeleteCredential = (credential: VaultCredential) => {
    setConfirmTarget({ kind: "credential", credential });
  };

  const requestDeleteFolder = (folder: VaultFolder) => {
    if (folder.credentials.length > 0) return;
    setConfirmTarget({ kind: "folder", folder });
  };

  const closeConfirmModal = () => setConfirmTarget(null);

  const handleConfirmDanger = () => {
    if (!confirmTarget) return;
    if (confirmTarget.kind === "credential") {
      const { credential } = confirmTarget;
      hideCredentialReveal(credential.id);
      onDeleteCredential(credential.id);
      centinelaToast.success("Credencial eliminada.");
    } else {
      onDeleteFolder(confirmTarget.folder.id);
      centinelaToast.success("Apartado eliminado.");
    }
    setConfirmTarget(null);
  };

  const confirmLock = () => {
    setLockModalOpen(false);
    onLockSession();
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden overscroll-none bg-[#030712] font-['Space_Grotesk',ui-sans-serif,system-ui,sans-serif] text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-32 h-136 w-136 rounded-full bg-cyan-500/12 blur-[130px]" />
        <div className="absolute -bottom-40 left-1/3 h-112 w-md rounded-full bg-violet-500/12 blur-[130px]" />
        <div className="absolute right-[10%] top-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <header
        className={`relative z-30 flex shrink-0 flex-col gap-2 border-b border-slate-700/80 bg-slate-950/90 py-2 backdrop-blur-md sm:gap-2.5 sm:py-2.5 lg:min-h-14 lg:flex-row lg:items-center lg:gap-3 lg:px-1`}
      >
        <div className="flex min-w-0 items-center gap-2 px-2 sm:px-3 lg:shrink-0 lg:px-2">
          <button
            type="button"
            onClick={() => setFoldersDrawerOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-600/80 bg-slate-900/80 text-slate-200 transition hover:border-cyan-400/45 hover:text-cyan-100 lg:hidden"
            aria-label="Abrir lista de apartados"
          >
            <MenuIcon />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3 lg:flex-initial">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-cyan-500/25 to-violet-600/25 ring-1 ring-white/10">
              <img
                src={centinelaLogoUrl}
                alt=""
                className="h-8 w-8 object-contain"
                width={32}
                height={32}
                decoding="async"
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-['Sora',ui-sans-serif,system-ui,sans-serif] text-base font-bold text-white sm:text-lg lg:text-xl">
                Centinela
              </h1>
              {selectedFolder && (
                <p className="truncate text-[11px] font-medium text-slate-500 lg:hidden">
                  {selectedFolder.name}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-600/80 bg-slate-900/80 text-slate-200 transition hover:border-cyan-400/45 hover:text-cyan-100 lg:hidden"
            aria-label="Buscar credenciales"
          >
            <SearchIcon />
          </button>
        </div>

        <div
          ref={searchAreaRef}
          className="relative hidden min-w-0 flex-1 px-2 sm:px-3 lg:block lg:px-0"
        >
          <label htmlFor="vault-global-search" className="sr-only">
            Búsqueda global en todas las credenciales
          </label>
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <SearchIcon />
          </div>
          <input
            id="vault-global-search"
            type="search"
            autoComplete="off"
            placeholder="Buscar en todos los apartados (cuenta, correo…)"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            className="w-full rounded-xl border border-slate-600/80 bg-slate-900/90 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
          {searchHits.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-80 overflow-y-auto rounded-xl border border-slate-600/80 bg-slate-950/98 py-1 shadow-2xl backdrop-blur-md">
              {searchHits.map((hit) => (
                <button
                  key={`${hit.folderId}-${hit.credential.id}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pickSearchHit(hit)}
                  className="flex w-full flex-col gap-0.5 border-b border-slate-800/80 px-4 py-3 text-left last:border-0 hover:bg-slate-900/90"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-cyan-300/90">
                    Apartado · {hit.folderName}
                  </span>
                  <span className="font-semibold text-white">{hit.credential.title}</span>
                  <span
                    data-context-copy="user-email"
                    className="select-text break-all text-sm text-slate-400"
                  >
                    {hit.credential.username}
                  </span>
                </button>
              ))}
            </div>
          )}
          {searchQuery.trim().length > 0 && searchHits.length === 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl border border-slate-600/80 bg-slate-950/98 px-4 py-3 text-sm text-slate-400 shadow-xl">
              Ninguna credencial coincide con «{searchQuery.trim()}».
            </div>
          )}
        </div>

        <div className="grid w-full grid-cols-3 gap-1.5 px-2 pb-1 sm:gap-2 sm:px-3 lg:flex lg:w-auto lg:shrink-0 lg:gap-2 lg:px-0 lg:pb-0">
          <button
            type="button"
            onClick={() => setFolderModalOpen(true)}
            className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 px-1.5 py-2 text-[10px] font-semibold leading-tight text-cyan-200 sm:px-2 sm:text-xs lg:px-3 lg:text-xs lg:whitespace-nowrap"
            title="Crear apartado"
          >
            <span className="lg:hidden">Apartado</span>
            <span className="hidden lg:inline">Crear apartado</span>
          </button>
          <button
            type="button"
            onClick={() => setCredentialModalOpen(true)}
            className="rounded-xl border border-violet-400/35 bg-violet-500/10 px-1.5 py-2 text-[10px] font-semibold leading-tight text-violet-200 sm:px-2 sm:text-xs lg:px-3 lg:text-xs lg:whitespace-nowrap"
            title="Nueva credencial"
          >
            <span className="lg:hidden">Credencial</span>
            <span className="hidden lg:inline">Nueva credencial</span>
          </button>
          <button
            type="button"
            onClick={() => setLockModalOpen(true)}
            className="rounded-xl border border-rose-400/60 bg-rose-500/10 px-1.5 py-2 text-[10px] font-semibold leading-tight text-rose-200 sm:px-2 sm:text-xs lg:px-3 lg:text-xs lg:whitespace-nowrap"
            title="Bloquear sesión"
          >
            <span className="lg:hidden">Bloquear</span>
            <span className="hidden lg:inline">Bloquear sesión</span>
          </button>
        </div>
      </header>

      <div className="relative z-20 flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-700/80 bg-slate-950/85 backdrop-blur-sm lg:flex">
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
                    onClick={() => onSelectFolder(folder.id)}
                    className="min-w-0 flex-1 px-4 py-3 text-left text-slate-200"
                  >
                    <p className="font-semibold text-white">{folder.name}</p>
                    <p className="text-xs text-slate-400">
                      {folder.credentials.length} credencial(es)
                    </p>
                  </button>
                  {canDeleteFolder && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        requestDeleteFolder(folder);
                      }}
                      className="shrink-0 rounded-lg border border-transparent px-2.5 text-slate-500 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-200"
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

        <main className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto">
          <div className="w-full px-4 py-6 sm:px-8 lg:px-10 xl:px-14">
            <div className="mb-4 lg:mb-6">
              <h2 className="mt-1 font-['Sora',ui-sans-serif,system-ui,sans-serif] text-xl font-bold text-white sm:text-2xl lg:text-3xl">
                {selectedFolder ? `${selectedFolder.name}` : "Credenciales"}
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                {selectedFolder?.credentials.length ? (
                  selectedFolder.credentials.map((credential) => {
                    const revealed = revealedIds.has(credential.id);
                    const isJumpHighlight = jumpToCredentialId === credential.id;
                    void revealCountdownTick;
                    const secondsUntilHide =
                      revealed && revealUntil[credential.id] !== undefined
                        ? Math.max(
                            0,
                            Math.ceil((revealUntil[credential.id] - Date.now()) / 1000)
                          )
                        : 0;
                    return (
                      <article
                        id={`credential-${credential.id}`}
                        key={credential.id}
                        className={`w-full rounded-2xl border bg-slate-900/50 p-4 transition-shadow duration-300 sm:p-5 lg:p-6 ${
                          isJumpHighlight
                            ? "border-cyan-400/55 shadow-lg shadow-cyan-900/25 ring-2 ring-cyan-400/35"
                            : "border-slate-700/80"
                        }`}
                      >
                        <div className="flex flex-col gap-5 lg:gap-6 xl:flex-row xl:items-stretch xl:gap-8">
                          <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">
                            <div className="min-w-0">
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Cuenta
                              </p>
                              <p className="mt-1 wrap-break-word text-lg font-bold text-white sm:text-xl lg:text-2xl xl:text-3xl">
                                {credential.title}
                              </p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Usuario / correo
                              </p>
                              <p
                                data-context-copy="user-email"
                                className="mt-1 break-all select-text text-base text-slate-200 sm:text-lg lg:text-xl xl:text-2xl"
                              >
                                {credential.username}
                              </p>
                            </div>
                            <div className="min-w-0 md:col-span-2 xl:col-span-1">
                              <p className="text-xs uppercase tracking-wide text-slate-500">
                                Contraseña
                              </p>
                              {revealed && secondsUntilHide > 0 && (
                                <p className="mt-1 text-xs font-medium text-cyan-400/90 tabular-nums">
                                  Se ocultará sola en {secondsUntilHide}s
                                </p>
                              )}
                              <p
                                className={`mt-1 break-all font-mono text-base tracking-wide sm:text-lg lg:text-xl xl:text-2xl ${
                                  revealed ? "text-cyan-100" : "text-slate-500 select-none"
                                }`}
                              >
                                {revealed
                                  ? credential.password
                                  : maskPassword(credential.password.length)}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-row flex-wrap gap-2 xl:flex-col xl:justify-center">
                            <button
                              type="button"
                              onClick={() => void handleRevealClick(credential.id)}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-200 hover:border-cyan-500/50 hover:text-cyan-100 xl:flex-none"
                              title={revealed ? "Ocultar" : "Mostrar"}
                            >
                              <EyeIcon open={revealed} />
                              <span className="xl:hidden">{revealed ? "Ocultar" : "Ver"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => void copyPassword(credential)}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-200 hover:border-violet-500/50 hover:text-violet-100 xl:flex-none"
                              title="Copiar contraseña"
                            >
                              <ClipboardIcon />
                              <span className="xl:hidden">Copiar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleEditClick(credential)}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-200 hover:border-amber-500/45 hover:text-amber-100 xl:flex-none"
                              title="Editar credencial"
                            >
                              <PencilIcon />
                              <span className="xl:hidden">Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDeleteCredential(credential)}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-sm font-medium text-slate-200 hover:border-rose-500/50 hover:text-rose-200 xl:flex-none"
                              title="Eliminar credencial"
                            >
                              <TrashIcon />
                              <span className="xl:hidden">Eliminar</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <p className="w-full rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-16 text-center text-lg text-slate-400">
                    No hay credenciales en este apartado. Pulsa{" "}
                    <span className="text-violet-200">Nueva credencial</span> arriba.
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <CreateFolderModal
        open={folderModalOpen}
        name={newFolderName}
        onNameChange={onFolderNameChange}
        onClose={() => setFolderModalOpen(false)}
        onSubmit={onCreateFolder}
      />
      <CreateCredentialModal
        open={credentialModalOpen}
        title={newCredentialTitle}
        username={newCredentialUsername}
        password={newCredentialPassword}
        onTitleChange={onCredentialTitleChange}
        onUsernameChange={onCredentialUsernameChange}
        onPasswordChange={onCredentialPasswordChange}
        onClose={() => setCredentialModalOpen(false)}
        onSubmit={onCreateCredential}
        onGenerateSecurePassword={onGenerateSecureCredentialPassword}
      />
      <EditCredentialModal
        open={editCredentialOpen}
        title={editCredentialTitle}
        username={editCredentialUsername}
        password={editCredentialPassword}
        onTitleChange={onEditTitleChange}
        onUsernameChange={onEditUsernameChange}
        onPasswordChange={onEditPasswordChange}
        onClose={onCloseEditCredential}
        onSubmit={onUpdateCredential}
        onGenerateSecurePassword={onGenerateSecureEditPassword}
      />
      <ConfirmDangerModal
        open={confirmTarget !== null}
        title={
          confirmTarget?.kind === "credential"
            ? "¿Eliminar esta credencial?"
            : "¿Eliminar este apartado?"
        }
        description={
          confirmTarget?.kind === "credential"
            ? `Se eliminará «${confirmTarget.credential.title}» de forma permanente. No podrás recuperarla.`
            : confirmTarget?.kind === "folder"
              ? `Se eliminará el apartado «${confirmTarget.folder.name}». Solo se pueden borrar apartados sin credenciales.`
              : ""
        }
        confirmLabel={
          confirmTarget?.kind === "credential"
            ? "Sí, eliminar credencial"
            : "Sí, eliminar apartado"
        }
        onCancel={closeConfirmModal}
        onConfirm={handleConfirmDanger}
      />
      <LockVaultModal
        open={lockModalOpen}
        onCancel={() => setLockModalOpen(false)}
        onConfirm={confirmLock}
      />
      <DashboardSearchModal
        open={searchModalOpen}
        onClose={() => {
          setSearchModalOpen(false);
          setSearchQuery("");
        }}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchHits={searchHits}
        onPickHit={pickSearchHit}
      />
      <DashboardFoldersDrawer
        open={foldersDrawerOpen}
        onClose={() => setFoldersDrawerOpen(false)}
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={onSelectFolder}
        onRequestDeleteFolder={(folder) => {
          setFoldersDrawerOpen(false);
          requestDeleteFolder(folder);
        }}
      />
      <IdleLockWarningModal
        open={idleWarningOpen}
        secondsLeft={idleSecondsLeft}
        onStayActive={stayActive}
      />
    </div>
  );
}
