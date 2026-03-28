#[cfg(windows)]
mod windows;

#[cfg(not(windows))]
mod non_windows;

#[cfg(windows)]
pub async fn request_user_verification(window: &tauri::Window) -> Result<(), String> {
    windows::request_user_verification(window).await
}

#[cfg(not(windows))]
pub async fn request_user_verification(window: &tauri::Window) -> Result<(), String> {
    non_windows::request_user_verification(window).await
}
