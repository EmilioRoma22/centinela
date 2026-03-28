use tauri::Window;

pub async fn request_user_verification(window: &Window) -> Result<(), String> {
    use windows::core::{factory, HSTRING};
    use windows::Security::Credentials::UI::{
        UserConsentVerificationResult, UserConsentVerifier,
    };
    use windows::Win32::System::WinRT::IUserConsentVerifierInterop;

    let hwnd = window.hwnd().map_err(|e| e.to_string())?;

    let purpose = HSTRING::from(
        "Centinela solicita Windows Hello, PIN o huella para ver o copiar contraseñas.",
    );

    let operation = {
        let interop = factory::<UserConsentVerifier, IUserConsentVerifierInterop>().map_err(|e| {
            format!("No se pudo preparar la verificación de Windows (interop): {e}")
        })?;
        unsafe {
            interop.RequestVerificationForWindowAsync::<windows_future::IAsyncOperation<
                UserConsentVerificationResult,
            >>(hwnd, &purpose)
        }
        .map_err(|e| format!("No se pudo iniciar la verificación: {e}"))?
    };

    let result = operation
        .await
        .map_err(|e| format!("Error en verificación del sistema: {e}"))?;

    match result {
        UserConsentVerificationResult::Verified => Ok(()),
        UserConsentVerificationResult::Canceled => Err("Verificación cancelada.".to_string()),
        _ => Err(
            "Windows no pudo completar la verificación (Hello / PIN no disponible o denegado)."
                .to_string(),
        ),
    }
}
