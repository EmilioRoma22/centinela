use crate::models::VaultFile;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

pub fn resolve_vault_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|err| format!("No se pudo resolver app_data_dir: {err}"))?;

    fs::create_dir_all(&data_dir).map_err(|err| format!("No se pudo crear data dir: {err}"))?;
    Ok(data_dir.join("vault.centinela"))
}

pub fn vault_exists(app: &tauri::AppHandle) -> Result<bool, String> {
    let vault_path = resolve_vault_path(app)?;
    Ok(vault_path.exists())
}

pub fn read_vault_file(app: &tauri::AppHandle) -> Result<VaultFile, String> {
    let vault_path = resolve_vault_path(app)?;
    if !vault_path.exists() {
        return Err("No existe una bóveda local. Primero debes crear tu llave maestra.".to_string());
    }

    let vault_raw =
        fs::read_to_string(&vault_path).map_err(|err| format!("No se pudo leer el vault: {err}"))?;
    serde_json::from_str(&vault_raw).map_err(|err| format!("Vault inválido o corrupto: {err}"))
}

pub fn write_vault_file_create(app: &tauri::AppHandle, vault_file: &VaultFile) -> Result<(), String> {
    let vault_path = resolve_vault_path(app)?;
    if vault_path.exists() {
        return Err(
            "Ya existe una bóveda local. Usa tu llave maestra para desbloquear.".to_string(),
        );
    }
    write_vault_atomic(&vault_path, vault_file)
}

pub fn write_vault_file_replace(app: &tauri::AppHandle, vault_file: &VaultFile) -> Result<(), String> {
    let vault_path = resolve_vault_path(app)?;
    write_vault_atomic(&vault_path, vault_file)
}

fn write_vault_atomic(vault_path: &Path, vault_file: &VaultFile) -> Result<(), String> {
    let parent: &Path = vault_path
        .parent()
        .ok_or_else(|| "Ruta de bóveda inválida.".to_string())?;
    let tmp_path: PathBuf = parent.join(format!(
        "vault.centinela.{}.tmp",
        std::process::id()
    ));

    let vault_data = serde_json::to_vec_pretty(vault_file)
        .map_err(|err| format!("No se pudo serializar el vault: {err}"))?;
    fs::write(&tmp_path, vault_data)
        .map_err(|err| format!("No se pudo escribir el vault temporal: {err}"))?;

    if vault_path.exists() {
        fs::remove_file(vault_path).map_err(|err| format!("No se pudo actualizar la bóveda: {err}"))?;
    }
    fs::rename(&tmp_path, vault_path).map_err(|err| format!("No se pudo activar la bóveda: {err}"))?;
    Ok(())
}

pub fn delete_vault_file(app: &tauri::AppHandle) -> Result<(), String> {
    let vault_path = resolve_vault_path(app)?;
    if !vault_path.exists() {
        return Err("No existe una bóveda local para reiniciar.".to_string());
    }

    fs::remove_file(vault_path).map_err(|err| format!("No se pudo reiniciar la bóveda: {err}"))
}
