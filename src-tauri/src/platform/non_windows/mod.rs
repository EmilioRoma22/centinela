
#[cfg(target_os = "linux")]
mod linux;

#[cfg(target_os = "macos")]
mod macos;

pub async fn request_user_verification(window: &tauri::Window) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        return linux::request_user_verification(window).await;
    }
    #[cfg(target_os = "macos")]
    {
        return macos::request_user_verification(window).await;
    }
    #[cfg(all(not(target_os = "linux"), not(target_os = "macos")))]
    {
        Ok(())
    }
}
