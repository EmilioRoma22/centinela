use crate::models::{VaultCredentialJson, VaultFolderJson};
use rusqlite::{params, Connection, DatabaseName};
use rusqlite::serialize::OwnedData;
use std::ops::Deref;
use std::ptr::NonNull;

const SCHEMA: &str = r#"
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS credentials (
  id TEXT PRIMARY KEY NOT NULL,
  folder_id TEXT NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_credentials_folder ON credentials(folder_id);

INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '1');
"#;

pub fn default_folder_tree() -> Vec<VaultFolderJson> {
    vec![
        VaultFolderJson {
            id: "social".to_string(),
            name: "Redes sociales".to_string(),
            credentials: vec![],
        },
        VaultFolderJson {
            id: "dev".to_string(),
            name: "Programacion".to_string(),
            credentials: vec![],
        },
    ]
}

pub fn open_memory_with_schema() -> rusqlite::Result<Connection> {
    let conn = Connection::open_in_memory()?;
    conn.execute_batch(SCHEMA)?;
    Ok(conn)
}

pub fn build_database(folders: &[VaultFolderJson]) -> rusqlite::Result<Connection> {
    let mut conn = open_memory_with_schema()?;
    replace_all_data(&mut conn, folders)?;
    Ok(conn)
}

pub fn replace_all_data(conn: &mut Connection, folders: &[VaultFolderJson]) -> rusqlite::Result<()> {
    let tx = conn.transaction()?;
    tx.execute("DELETE FROM credentials", [])?;
    tx.execute("DELETE FROM folders", [])?;
    for folder in folders {
        tx.execute(
            "INSERT INTO folders (id, name) VALUES (?1, ?2)",
            params![folder.id, folder.name],
        )?;
        for c in &folder.credentials {
            tx.execute(
                "INSERT INTO credentials (id, folder_id, title, username, password)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![c.id, folder.id, c.title, c.username, c.password],
            )?;
        }
    }
    tx.commit()?;
    Ok(())
}

pub fn export_folders(conn: &Connection) -> rusqlite::Result<Vec<VaultFolderJson>> {
    let mut stmt = conn.prepare("SELECT id, name FROM folders ORDER BY id")?;
    let folder_rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;

    let mut out = Vec::new();
    for fr in folder_rows {
        let (id, name) = fr?;
        let mut cstmt = conn.prepare(
            "SELECT id, title, username, password FROM credentials WHERE folder_id = ?1 ORDER BY id",
        )?;
        let creds: Vec<VaultCredentialJson> = cstmt
            .query_map(params![id.clone()], |row| {
                Ok(VaultCredentialJson {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    username: row.get(2)?,
                    password: row.get(3)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        out.push(VaultFolderJson {
            id,
            name,
            credentials: creds,
        });
    }
    Ok(out)
}

pub fn serialize_database(conn: &Connection) -> rusqlite::Result<Vec<u8>> {
    let data = conn.serialize(DatabaseName::Main)?;
    Ok(data.deref().to_vec())
}

pub fn deserialize_to_connection(bytes: &[u8]) -> rusqlite::Result<Connection> {
    let len = bytes.len();
    let len_i32 = i32::try_from(len).map_err(|_| {
        rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_TOOBIG),
            Some("Imagen SQLite demasiado grande.".into()),
        )
    })?;
    let ptr = unsafe { rusqlite::ffi::sqlite3_malloc(len_i32) as *mut u8 };
    if ptr.is_null() {
        return Err(rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_NOMEM),
            Some("sqlite3_malloc falló al cargar la bóveda".into()),
        ));
    }
    unsafe {
        std::ptr::copy_nonoverlapping(bytes.as_ptr(), ptr, len);
    }
    let owned = unsafe { OwnedData::from_raw_nonnull(NonNull::new(ptr).unwrap(), len) };
    let mut conn = Connection::open_in_memory()?;
    conn.deserialize(DatabaseName::Main, owned, false)?;
    Ok(conn)
}
