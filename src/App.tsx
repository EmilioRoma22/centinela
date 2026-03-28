import { useEffect, useMemo, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AuthScreen } from "./components/AuthScreen";
import { DashboardScreen } from "./components/DashboardScreen";
import { ResetVaultModal } from "./components/ResetVaultModal";
import { SecurityModal } from "./components/SecurityModal";
import { centinelaToast } from "./lib/centinelaToast";
import {
  CommandResponse,
  VaultCredential,
  VaultFolder,
  VaultSessionResponse,
  VaultStatus,
} from "./types/vault";
import { writeClipboardText } from "./utils/clipboard";
import { buildInitialFolders, createId } from "./utils/folders";
import "./App.css";

function App() {
  const sessionMasterKeyRef = useRef("");

  const [isLoading, setIsLoading] = useState(true);
  const [isFirstUse, setIsFirstUse] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [masterKey, setMasterKey] = useState("");
  const [confirmMasterKey, setConfirmMasterKey] = useState("");

  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showResetVaultModal, setShowResetVaultModal] = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");
  const [modalFeedback, setModalFeedback] = useState("");

  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newCredentialTitle, setNewCredentialTitle] = useState("");
  const [newCredentialUsername, setNewCredentialUsername] = useState("");
  const [newCredentialPassword, setNewCredentialPassword] = useState("");

  const [editCredentialId, setEditCredentialId] = useState<string | null>(null);
  const [editCredentialTitle, setEditCredentialTitle] = useState("");
  const [editCredentialUsername, setEditCredentialUsername] = useState("");
  const [editCredentialPassword, setEditCredentialPassword] = useState("");

  useEffect(() => {
    if (!isUnlocked) return;
    const masterKey = sessionMasterKeyRef.current;
    if (!masterKey) return;

    const handle = window.setTimeout(() => {
      invoke<CommandResponse>("save_vault", { masterKey, folders }).catch((error) => {
        centinelaToast.error(String(error));
      });
    }, 400);

    return () => clearTimeout(handle);
  }, [folders, isUnlocked]);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await invoke<VaultStatus>("get_vault_status");
        setIsFirstUse(status.kind === "NoVault");
      } catch {
        centinelaToast.error("No pudimos leer el estado del almacén local.");
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();
  }, []);

  const isCreateMode = useMemo(() => isFirstUse, [isFirstUse]);
  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId) ?? null,
    [folders, selectedFolderId]
  );

  const handleUnlockSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (masterKey.length < 12) {
      centinelaToast.error("La llave debe tener al menos 12 caracteres.");
      return;
    }

    try {
      const result = await invoke<VaultSessionResponse>("unlock_vault", { masterKey });
      sessionMasterKeyRef.current = masterKey;
      setFolders(result.folders);
      setSelectedFolderId(result.folders[0]?.id ?? "");
      centinelaToast.success(result.message);
      setMasterKey("");
      setIsUnlocked(true);
    } catch (error) {
      centinelaToast.error(String(error));
    }
  };

  const handleCreateSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (masterKey.length < 12) {
      centinelaToast.error("La llave debe tener al menos 12 caracteres.");
      return;
    }

    if (masterKey !== confirmMasterKey) {
      centinelaToast.error("Las llaves no coinciden.");
      return;
    }

    try {
      const result = await invoke<VaultSessionResponse>("create_vault", {
        masterKey,
        confirmMasterKey,
      });
      sessionMasterKeyRef.current = masterKey;
      setFolders(result.folders);
      setSelectedFolderId(result.folders[0]?.id ?? "");
      centinelaToast.success(result.message);
      setIsFirstUse(false);
      setConfirmMasterKey("");
      setMasterKey("");
      setIsUnlocked(true);
    } catch (error) {
      centinelaToast.error(String(error));
    }
  };

  const handleGenerateSecurePassword = async () => {
    try {
      const newKey = await invoke<string>("generate_secure_master_key");
      setMasterKey(newKey);
      setConfirmMasterKey(newKey);
      setGeneratedKey(newKey);
      await writeClipboardText(newKey);
      setModalFeedback("Llave copiada al portapapeles.");
      setShowSecurityModal(true);
    } catch {
      centinelaToast.error(
        "No se pudo generar o copiar automáticamente. Intenta nuevamente."
      );
    }
  };

  const confirmResetVault = async () => {
    setShowResetVaultModal(false);

    try {
      const result = await invoke<CommandResponse>("reset_vault");
      sessionMasterKeyRef.current = "";
      const fresh = buildInitialFolders();
      setFolders(fresh);
      setSelectedFolderId(fresh[0].id);
      centinelaToast.success(result.message);
      setIsFirstUse(true);
      setMasterKey("");
      setConfirmMasterKey("");
      setIsUnlocked(false);
    } catch (error) {
      centinelaToast.error(String(error));
    }
  };

  const handleCopyGeneratedKey = async () => {
    if (!generatedKey) {
      setModalFeedback("No hay ninguna llave generada para copiar.");
      return;
    }
    try {
      await writeClipboardText(generatedKey);
      setModalFeedback("Llave copiada correctamente.");
    } catch {
      setModalFeedback("No se pudo copiar la llave. Copiala manualmente.");
    }
  };

  const handleDownloadGeneratedKey = () => {
    if (!generatedKey) {
      setModalFeedback("No hay ninguna llave generada para descargar.");
      return;
    }
    const fileContent = [
      "LLAVE MAESTRA CENTINELA",
      "",
      generatedKey,
      "",
      "IMPORTANTE:",
      "Sin esta llave no podras entrar al sistema ni ver tus contrasenas.",
      "Guardala en un lugar seguro y no la compartas con nadie.",
    ].join("\n");

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "centinela-llave-maestra.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    setModalFeedback(
      "Archivo descargado correctamente. Se encuentra en su carpeta de Descargas."
    );
  };

  const handleCreateFolder = (): boolean => {
    const name = newFolderName.trim();
    if (!name) {
      centinelaToast.error("Escribe un nombre valido para el apartado.");
      return false;
    }
    const newFolder: VaultFolder = { id: createId(), name, credentials: [] };
    setFolders((prev) => [...prev, newFolder]);
    setSelectedFolderId(newFolder.id);
    setNewFolderName("");
    centinelaToast.success("Apartado creado correctamente.");
    return true;
  };

  const handleCreateCredential = (): boolean => {
    if (!selectedFolderId) {
      centinelaToast.error("Primero selecciona o crea un apartado.");
      return false;
    }

    const title = newCredentialTitle.trim();
    const username = newCredentialUsername.trim();
    const password = newCredentialPassword.trim();
    if (!title || !username || !password) {
      centinelaToast.error("Completa titulo, usuario y contraseña.");
      return false;
    }

    const newCredential: VaultCredential = { id: createId(), title, username, password };
    setFolders((prev) =>
      prev.map((folder) =>
        folder.id === selectedFolderId
          ? { ...folder, credentials: [...folder.credentials, newCredential] }
          : folder
      )
    );
    setNewCredentialTitle("");
    setNewCredentialUsername("");
    setNewCredentialPassword("");
    centinelaToast.success("Contraseña guardada en el apartado seleccionado.");
    return true;
  };

  const startEditCredential = (credential: VaultCredential) => {
    setEditCredentialId(credential.id);
    setEditCredentialTitle(credential.title);
    setEditCredentialUsername(credential.username);
    setEditCredentialPassword(credential.password);
  };

  const closeEditCredential = () => {
    setEditCredentialId(null);
    setEditCredentialTitle("");
    setEditCredentialUsername("");
    setEditCredentialPassword("");
  };

  const handleUpdateCredential = (): boolean => {
    if (!selectedFolderId || !editCredentialId) {
      centinelaToast.error("No hay credencial seleccionada para editar.");
      return false;
    }

    const title = editCredentialTitle.trim();
    const username = editCredentialUsername.trim();
    const password = editCredentialPassword.trim();
    if (!title || !username || !password) {
      centinelaToast.error("Completa titulo, usuario y contraseña.");
      return false;
    }

    setFolders((prev) =>
      prev.map((folder) =>
        folder.id !== selectedFolderId
          ? folder
          : {
              ...folder,
              credentials: folder.credentials.map((c) =>
                c.id === editCredentialId ? { ...c, title, username, password } : c
              ),
            }
      )
    );
    closeEditCredential();
    centinelaToast.success("Credencial actualizada.");
    return true;
  };

  const handleDeleteCredential = (credentialId: string) => {
    if (!selectedFolderId) return;
    setFolders((prev) =>
      prev.map((folder) =>
        folder.id !== selectedFolderId
          ? folder
          : {
              ...folder,
              credentials: folder.credentials.filter((c) => c.id !== credentialId),
            }
      )
    );
    if (editCredentialId === credentialId) {
      closeEditCredential();
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) => {
      const folder = prev.find((f) => f.id === folderId);
      if (!folder || folder.credentials.length > 0) return prev;
      const next = prev.filter((f) => f.id !== folderId);
      setSelectedFolderId((current) =>
        current === folderId ? next[0]?.id ?? "" : current
      );
      return next;
    });
  };

  const handleLockSession = async () => {
    try {
      await invoke<CommandResponse>("save_vault", {
        masterKey: sessionMasterKeyRef.current,
        folders,
      });
    } catch (error) {
      centinelaToast.error(String(error));
    }
    sessionMasterKeyRef.current = "";
    setIsUnlocked(false);
    closeEditCredential();
    centinelaToast.info("Sesión bloqueada.");
  };

  const handleIdleLock = async () => {
    try {
      await invoke<CommandResponse>("save_vault", {
        masterKey: sessionMasterKeyRef.current,
        folders,
      });
    } catch (error) {
      centinelaToast.error(String(error));
    }
    sessionMasterKeyRef.current = "";
    setIsUnlocked(false);
    closeEditCredential();
    centinelaToast.info("Bóveda bloqueada por inactividad.");
  };

  if (isUnlocked) {
    return (
      <DashboardScreen
        folders={folders}
        selectedFolderId={selectedFolderId}
        selectedFolder={selectedFolder}
        newFolderName={newFolderName}
        newCredentialTitle={newCredentialTitle}
        newCredentialUsername={newCredentialUsername}
        newCredentialPassword={newCredentialPassword}
        editCredentialOpen={editCredentialId !== null}
        editCredentialTitle={editCredentialTitle}
        editCredentialUsername={editCredentialUsername}
        editCredentialPassword={editCredentialPassword}
        onFolderNameChange={setNewFolderName}
        onCredentialTitleChange={setNewCredentialTitle}
        onCredentialUsernameChange={setNewCredentialUsername}
        onCredentialPasswordChange={setNewCredentialPassword}
        onEditTitleChange={setEditCredentialTitle}
        onEditUsernameChange={setEditCredentialUsername}
        onEditPasswordChange={setEditCredentialPassword}
        onSelectFolder={setSelectedFolderId}
        onCreateFolder={handleCreateFolder}
        onCreateCredential={handleCreateCredential}
        onStartEditCredential={startEditCredential}
        onCloseEditCredential={closeEditCredential}
        onUpdateCredential={handleUpdateCredential}
        onDeleteCredential={handleDeleteCredential}
        onDeleteFolder={handleDeleteFolder}
        onLockSession={handleLockSession}
        onIdleLock={handleIdleLock}
        onGenerateSecureCredentialPassword={async () => {
          try {
            const pwd = await invoke<string>("generate_secure_credential_password");
            setNewCredentialPassword(pwd);
            await writeClipboardText(pwd);
            centinelaToast.info("Contraseña segura generada y copiada al portapapeles.");
          } catch (e) {
            centinelaToast.error(String(e));
          }
        }}
        onGenerateSecureEditPassword={async () => {
          try {
            const pwd = await invoke<string>("generate_secure_credential_password");
            setEditCredentialPassword(pwd);
            centinelaToast.info("Nueva contraseña segura lista.");
          } catch (e) {
            centinelaToast.error(String(e));
          }
        }}
      />
    );
  }

  return (
    <>
      <AuthScreen
        isLoading={isLoading}
        isCreateMode={isCreateMode}
        masterKey={masterKey}
        confirmMasterKey={confirmMasterKey}
        onMasterKeyChange={setMasterKey}
        onConfirmMasterKeyChange={setConfirmMasterKey}
        onCreateSubmit={handleCreateSubmit}
        onUnlockSubmit={handleUnlockSubmit}
        onGenerateSecurePassword={handleGenerateSecurePassword}
        onRequestResetVault={() => setShowResetVaultModal(true)}
      />
      {showResetVaultModal && (
        <ResetVaultModal
          onCancel={() => setShowResetVaultModal(false)}
          onConfirm={confirmResetVault}
        />
      )}
      {showSecurityModal && (
        <SecurityModal
          generatedKey={generatedKey}
          modalFeedback={modalFeedback}
          onCopyAgain={handleCopyGeneratedKey}
          onDownload={handleDownloadGeneratedKey}
          onClose={() => {
            setShowSecurityModal(false);
            setModalFeedback("");
          }}
        />
      )}
    </>
  );
}

export default App;
