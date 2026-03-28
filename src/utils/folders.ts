import { VaultFolder } from "../types/vault";

export const createId = (): string => {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const buildInitialFolders = (): VaultFolder[] => [
  { id: "social", name: "Redes sociales", credentials: [] },
  { id: "dev", name: "Programacion", credentials: [] },
];
