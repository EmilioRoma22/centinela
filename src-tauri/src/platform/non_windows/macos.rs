

use std::process::Command;
use tauri::Window;

pub async fn request_user_verification(_window: &Window) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(macos_prompt)
        .await
        .map_err(|e| format!("Error al ejecutar la verificación: {e}"))?
}

fn macos_prompt() -> Result<(), String> {
    let status = Command::new("osascript")
        .args([
            "-e",
            r#"display dialog "Centinela: confirma tu identidad para ver o copiar contraseñas." with title "Centinela" buttons {"Cancelar", "Continuar"} default button "Continuar" with icon caution"#,
        ])
        .status()
        .map_err(|e| format!("No se pudo ejecutar osascript: {e}"))?;

    if status.success() {
        Ok(())
    } else if status.code() == Some(1) {
        Err("Verificación cancelada.".to_string())
    } else {
        Err(format!(
            "El diálogo terminó con código: {:?}",
            status.code()
        ))
    }
}
