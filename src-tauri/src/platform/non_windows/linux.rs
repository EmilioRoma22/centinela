use std::io::ErrorKind;
use std::process::Command;
use tauri::Window;

pub async fn request_user_verification(_window: &Window) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(linux_prompt)
        .await
        .map_err(|e| format!("Error al ejecutar la verificación: {e}"))?
}

fn linux_prompt() -> Result<(), String> {
    if let Some(r) = run_zenity_password() {
        return r;
    }
    if let Some(r) = run_kdialog_password() {
        return r;
    }
    if let Some(r) = run_yad_password() {
        return r;
    }

    Err(
        "No se encontró ningún diálogo gráfico (zenity, kdialog o yad). \
         Instala uno, por ejemplo: sudo apt install zenity"
            .to_string(),
    )
}

fn interpret_exit(status: std::process::ExitStatus) -> Result<(), String> {
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

fn run_zenity_password() -> Option<Result<(), String>> {
    let output = match Command::new("zenity")
        .args([
            "--password",
            "--title=Centinela",
            "--text=Confirma tu identidad para ver o copiar contraseñas (puedes usar tu contraseña de usuario o cualquier texto).",
        ])
        .output()
    {
        Ok(o) => o,
        Err(e) if e.kind() == ErrorKind::NotFound => return None,
        Err(e) => return Some(Err(format!("zenity: {e}"))),
    };
    Some(interpret_exit(output.status))
}

fn run_kdialog_password() -> Option<Result<(), String>> {
    let output = match Command::new("kdialog").args([
        "--password",
        "Centinela — confirma tu identidad para acciones sensibles.",
    ]).output() {
        Ok(o) => o,
        Err(e) if e.kind() == ErrorKind::NotFound => return None,
        Err(e) => return Some(Err(format!("kdialog: {e}"))),
    };
    Some(interpret_exit(output.status))
}

fn run_yad_password() -> Option<Result<(), String>> {
    let output = match Command::new("yad")
        .args([
            "--entry",
            "--hide-text",
            "--title=Centinela",
            "--text=Confirma tu identidad:",
            "--button=OK:0",
            "--button=Cancelar:1",
        ])
        .output()
    {
        Ok(o) => o,
        Err(e) if e.kind() == ErrorKind::NotFound => return None,
        Err(e) => return Some(Err(format!("yad: {e}"))),
    };
    Some(interpret_exit(output.status))
}
