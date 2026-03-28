use crate::crypto::{
    decode_b64, decrypt_vault_blob, derive_vault_encryption_key, encode_b64, encrypt_vault_blob,
    generate_kdf_salt, hash_master_key, verify_master_key,
};
use crate::models::{
    CommandResponse, VaultFile, VaultFolderJson, VaultSessionResponse, VaultStatus,
};
use crate::vault::{
    delete_vault_file, read_vault_file, vault_exists, write_vault_file_create,
    write_vault_file_replace,
};
use crate::vault_db;
use zeroize::Zeroize;

fn persist_encrypted_payload(
    mut vault_file: VaultFile,
    master_key: &str,
    folders: &[VaultFolderJson],
) -> Result<VaultFile, String> {
    let kdf_salt_bytes: [u8; 32] = if let Some(ref s) = vault_file.kdf_salt {
        let b = decode_b64(s)?;
        if b.len() != 32 {
            return Err("Salt HKDF inválido.".to_string());
        }
        let mut a = [0_u8; 32];
        a.copy_from_slice(&b);
        a
    } else {
        let s = generate_kdf_salt();
        vault_file.kdf_salt = Some(encode_b64(&s));
        s
    };

    let enc_key = derive_vault_encryption_key(master_key, &kdf_salt_bytes)?;
    let conn = vault_db::build_database(folders).map_err(|e| e.to_string())?;
    let blob = vault_db::serialize_database(&conn).map_err(|e| e.to_string())?;
    let (nonce, ciphertext) = encrypt_vault_blob(&enc_key, &blob)?;
    vault_file.version = 2;
    vault_file.nonce = Some(encode_b64(&nonce));
    vault_file.ciphertext = Some(encode_b64(&ciphertext));
    Ok(vault_file)
}

#[tauri::command]
pub fn get_vault_status(app: tauri::AppHandle) -> Result<VaultStatus, String> {
    if vault_exists(&app)? {
        Ok(VaultStatus::VaultPresent)
    } else {
        Ok(VaultStatus::NoVault)
    }
}

#[tauri::command(rename_all = "camelCase")]
pub fn create_vault(
    app: tauri::AppHandle,
    mut master_key: String,
    mut confirm_master_key: String,
) -> Result<VaultSessionResponse, String> {
    if master_key.len() < 12 {
        master_key.zeroize();
        confirm_master_key.zeroize();
        return Err("La llave debe tener al menos 12 caracteres.".to_string());
    }

    if master_key != confirm_master_key {
        master_key.zeroize();
        confirm_master_key.zeroize();
        return Err("Las llaves no coinciden.".to_string());
    }

    let master_key_hash = hash_master_key(&master_key)?;
    let kdf_salt = generate_kdf_salt();
    let vault_file = VaultFile {
        master_key_hash,
        kdf_salt: Some(encode_b64(&kdf_salt)),
        ..Default::default()
    };

    let folders = vault_db::default_folder_tree();
    let vault_file = persist_encrypted_payload(vault_file, &master_key, &folders)?;
    write_vault_file_create(&app, &vault_file)?;

    master_key.zeroize();
    confirm_master_key.zeroize();

    Ok(VaultSessionResponse {
        message: "Bóveda creada correctamente. Tu llave maestra quedó protegida con Argon2id."
            .to_string(),
        folders,
    })
}

#[tauri::command(rename_all = "camelCase")]
pub fn unlock_vault(
    app: tauri::AppHandle,
    mut master_key: String,
) -> Result<VaultSessionResponse, String> {
    if master_key.len() < 12 {
        master_key.zeroize();
        return Err("La llave debe tener al menos 12 caracteres.".to_string());
    }

    let vault_file = read_vault_file(&app)?;
    verify_master_key(&master_key, &vault_file.master_key_hash)?;

    let folders = if vault_file.ciphertext.is_none() || vault_file.kdf_salt.is_none() {
        vault_db::default_folder_tree()
    } else {
        let salt_vec = decode_b64(vault_file.kdf_salt.as_ref().unwrap())?;
        if salt_vec.len() != 32 {
            master_key.zeroize();
            return Err("Salt HKDF inválido en el archivo de bóveda.".to_string());
        }
        let mut salt = [0_u8; 32];
        salt.copy_from_slice(&salt_vec);
        let nonce = decode_b64(
            vault_file
                .nonce
                .as_ref()
                .ok_or_else(|| "Falta nonce en la bóveda.".to_string())?,
        )?;
        let ciphertext = decode_b64(
            vault_file
                .ciphertext
                .as_ref()
                .ok_or_else(|| "Falta payload cifrado en la bóveda.".to_string())?,
        )?;
        let enc_key = derive_vault_encryption_key(&master_key, &salt)?;
        let plain = decrypt_vault_blob(&enc_key, &nonce, &ciphertext)?;
        let conn = vault_db::deserialize_to_connection(&plain).map_err(|e| e.to_string())?;
        vault_db::export_folders(&conn).map_err(|e| e.to_string())?
    };

    master_key.zeroize();

    Ok(VaultSessionResponse {
        message: "Bóveda desbloqueada correctamente.".to_string(),
        folders,
    })
}

#[tauri::command(rename_all = "camelCase")]
pub fn save_vault(
    app: tauri::AppHandle,
    mut master_key: String,
    folders: Vec<VaultFolderJson>,
) -> Result<CommandResponse, String> {
    if master_key.len() < 12 {
        master_key.zeroize();
        return Err("La llave debe tener al menos 12 caracteres.".to_string());
    }

    let vault_file = read_vault_file(&app)?;
    verify_master_key(&master_key, &vault_file.master_key_hash)?;
    let vault_file = persist_encrypted_payload(vault_file, &master_key, &folders)?;
    write_vault_file_replace(&app, &vault_file)?;

    master_key.zeroize();

    Ok(CommandResponse {
        message: "Bóveda guardada.".to_string(),
    })
}

#[tauri::command]
pub fn generate_secure_master_key() -> String {
    crate::crypto::generate_secure_master_key()
}

#[tauri::command]
pub fn generate_secure_credential_password() -> String {
    crate::crypto::generate_secure_credential_password()
}

#[tauri::command]
pub fn reset_vault(app: tauri::AppHandle) -> Result<CommandResponse, String> {
    delete_vault_file(&app)?;
    Ok(CommandResponse {
        message: "Bóveda reiniciada. Ya puedes crear una nueva llave maestra.".to_string(),
    })
}

#[tauri::command]
pub async fn verify_user_presence(window: tauri::Window) -> Result<(), String> {
    crate::platform::request_user_verification(&window).await
}
