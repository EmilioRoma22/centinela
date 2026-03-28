export type VaultStatus = {
  kind: "NoVault" | "VaultPresent";
};

export type CommandResponse = {
  message: string;
};

export type VaultSessionResponse = {
  message: string;
  folders: VaultFolder[];
};

export type VaultCredential = {
  id: string;
  title: string;
  username: string;
  password: string;
};

export type VaultFolder = {
  id: string;
  name: string;
  credentials: VaultCredential[];
};
