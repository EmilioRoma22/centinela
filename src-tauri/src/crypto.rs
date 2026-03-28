use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine;
use chacha20poly1305::aead::{Aead, KeyInit};
use chacha20poly1305::ChaCha20Poly1305;
use hkdf::Hkdf;
use rand::rngs::OsRng as RandOsRng;
use rand::RngCore;
use sha2::Sha256;

pub fn hash_master_key(master_key: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut RandOsRng);
    Argon2::default()
        .hash_password(master_key.as_bytes(), &salt)
        .map_err(|err| format!("No se pudo proteger la llave maestra: {err}"))
        .map(|hash| hash.to_string())
}

pub const VAULT_HKDF_INFO: &[u8] = b"centinela.vault.v1";

pub fn verify_master_key(master_key: &str, hash: &str) -> Result<(), String> {
    let parsed_hash =
        PasswordHash::new(hash).map_err(|err| format!("Hash de llave inválido: {err}"))?;
    Argon2::default()
        .verify_password(master_key.as_bytes(), &parsed_hash)
        .map_err(|_| "La llave maestra no es correcta.".to_string())
}

pub fn generate_secure_master_key() -> String {
    generate_from_entropy(24)
}

pub fn generate_secure_credential_password() -> String {
    generate_from_entropy(28)
}

pub fn generate_kdf_salt() -> [u8; 32] {
    let mut salt = [0_u8; 32];
    RandOsRng.fill_bytes(&mut salt);
    salt
}

pub fn derive_vault_encryption_key(master_key: &str, kdf_salt: &[u8]) -> Result<[u8; 32], String> {
    let hk = Hkdf::<Sha256>::new(Some(kdf_salt), master_key.as_bytes());
    let mut okm = [0_u8; 32];
    hk.expand(VAULT_HKDF_INFO, &mut okm)
        .map_err(|_| "No se pudo derivar la clave de cifrado de la bóveda.".to_string())?;
    Ok(okm)
}

pub fn encrypt_vault_blob(
    key: &[u8; 32],
    plaintext: &[u8],
) -> Result<(Vec<u8>, Vec<u8>), String> {
    let cipher = ChaCha20Poly1305::new_from_slice(key)
        .map_err(|e| format!("Clave de cifrado inválida: {e}"))?;
    let mut nonce_bytes = [0_u8; 12];
    RandOsRng.fill_bytes(&mut nonce_bytes);
    let nonce = chacha20poly1305::Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| format!("No se pudo cifrar la bóveda: {e}"))?;
    Ok((nonce_bytes.to_vec(), ciphertext))
}

pub fn decrypt_vault_blob(
    key: &[u8; 32],
    nonce: &[u8],
    ciphertext: &[u8],
) -> Result<Vec<u8>, String> {
    if nonce.len() != 12 {
        return Err("Nonce de bóveda inválido.".to_string());
    }
    let cipher = ChaCha20Poly1305::new_from_slice(key)
        .map_err(|e| format!("Clave de cifrado inválida: {e}"))?;
    let nonce_arr = chacha20poly1305::Nonce::from_slice(nonce);
    cipher
        .decrypt(nonce_arr, ciphertext)
        .map_err(|_| "No se pudo descifrar la bóveda (llave incorrecta o datos corruptos).".to_string())
}

pub fn encode_b64(bytes: &[u8]) -> String {
    B64.encode(bytes)
}

pub fn decode_b64(s: &str) -> Result<Vec<u8>, String> {
    B64.decode(s)
        .map_err(|e| format!("Datos en base64 inválidos: {e}"))
}

fn generate_from_entropy(byte_len: usize) -> String {
    let charset = b"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+";
    let mut bytes = vec![0_u8; byte_len];
    RandOsRng.fill_bytes(&mut bytes);
    bytes
        .iter()
        .map(|byte| charset[(*byte as usize) % charset.len()] as char)
        .collect()
}
