use serde::{Deserialize, Serialize};

#[derive(Serialize)]
#[serde(tag = "kind")]
pub enum VaultStatus {
    NoVault,
    VaultPresent,
}

#[derive(Serialize)]
pub struct CommandResponse {
    pub message: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaultCredentialJson {
    pub id: String,
    pub title: String,
    pub username: String,
    pub password: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaultFolderJson {
    pub id: String,
    pub name: String,
    pub credentials: Vec<VaultCredentialJson>,
}

#[derive(Serialize)]
pub struct VaultSessionResponse {
    pub message: String,
    pub folders: Vec<VaultFolderJson>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaultFile {
    pub version: u8,
    pub master_key_hash: String,
    #[serde(default)]
    pub kdf_salt: Option<String>,
    #[serde(default)]
    pub nonce: Option<String>,
    #[serde(default)]
    pub ciphertext: Option<String>,
}

impl Default for VaultFile {
    fn default() -> Self {
        Self {
            version: 2,
            master_key_hash: String::new(),
            kdf_salt: None,
            nonce: None,
            ciphertext: None,
        }
    }
}
