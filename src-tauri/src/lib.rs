mod commands;
mod crypto;
mod models;
mod platform;
mod vault;
mod vault_db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_vault_status,
            commands::create_vault,
            commands::unlock_vault,
            commands::save_vault,
            commands::generate_secure_master_key,
            commands::generate_secure_credential_password,
            commands::reset_vault,
            commands::verify_user_presence
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
