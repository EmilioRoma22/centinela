#[cfg(windows)]
mod windows;


#[cfg(windows)]
pub async fn request_user_verification(window: &tauri::Window) -> Result<(), String> {
    windows::request_user_verification(window).await
}