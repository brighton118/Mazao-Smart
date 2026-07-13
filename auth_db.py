import os
import sqlite3
import bcrypt
import uuid
import json
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users_auth.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        national_id TEXT,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        farm_name TEXT NOT NULL,
        farm_location TEXT NOT NULL, -- JSON string or textual representation
        profile_image TEXT, -- Base64 data or relative path
        language TEXT DEFAULT 'en',
        preferred_language TEXT DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        account_status TEXT DEFAULT 'active'
    )
    """)
    
    # Check if preferred_language column is present (for migration safety)
    cursor.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'preferred_language' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN preferred_language TEXT DEFAULT 'en'")
        conn.commit()
        
    # Create sessions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)
    
    # Create refresh_tokens table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)
    
    # Create password_reset_tokens table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)
    
    conn.commit()
    conn.close()
    
    # Seed default accounts if empty
    seed_default_users()

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def seed_default_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        # Predefined credentials as requested:
        # Administrator: admin / admin123
        # Farmer: farmer1 / farmer123
        # Agronomist: agronomist1 / agro123
        # Technician: technician1 / tech123
        
        default_users = [
            ("Admin Name", "admin", "admin@agrisense.io", "+256 700 000001", "ID100001", "admin123", "Administrator", "Mbarara Main Hub", "Mbarara, Kakoba, GPS: -0.6074, 30.6548", "en"),
            ("Moses Farmer", "farmer1", "farmer1@agrisense.io", "+256 700 000002", "ID100002", "farmer123", "Farmer", "Mbarara Coffee Estate", "Mbarara, Kakoba, GPS: -0.6120, 30.6690", "en"),
            ("Dr. Sarah Agronomist", "agronomist1", "agronomist1@agrisense.io", "+256 700 000003", "ID100003", "agro123", "Agronomist", "Mbarara Research Station", "Mbarara, Kakoba, GPS: -0.6050, 30.6500", "en"),
            ("Dan Technician", "technician1", "technician1@agrisense.io", "+256 700 000004", "ID100004", "tech123", "Technician", "Mazao Hardware Lab", "Mbarara, Kakoba, GPS: -0.6090, 30.6520", "en")
        ]
        
        for full_name, username, email, phone, nid, password, role, farm_name, farm_location, lang in default_users:
            pwd_hash = hash_password(password)
            cursor.execute("""
            INSERT INTO users (full_name, username, email, phone, national_id, password_hash, role, farm_name, farm_location, preferred_language)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (full_name, username, email, phone, nid, pwd_hash, role, farm_name, farm_location, lang))
        conn.commit()
    conn.close()

# Users management logic
def get_user_by_id(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_username_or_email(identifier: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? OR email = ?", (identifier, identifier))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_user(user_data: dict) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    pwd_hash = hash_password(user_data['password'])
    
    cursor.execute("""
    INSERT INTO users (full_name, username, email, phone, national_id, password_hash, role, farm_name, farm_location, preferred_language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_data['full_name'],
        user_data['username'],
        user_data['email'],
        user_data['phone'],
        user_data.get('national_id'),
        pwd_hash,
        user_data['role'],
        user_data['farm_name'],
        user_data['farm_location'],
        user_data.get('preferred_language', 'en')
    ))
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return user_id

def update_user_profile(user_id: int, updates: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Dynamically build the set query
    fields = []
    values = []
    allowed_fields = ['full_name', 'phone', 'national_id', 'farm_name', 'farm_location', 'preferred_language']
    for k, v in updates.items():
        if k in allowed_fields:
            fields.append(f"{k} = ?")
            values.append(v)
            
    if fields:
        fields.append("updated_at = ?")
        values.append(datetime.utcnow().isoformat())
        values.append(user_id)
        
        query = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
        cursor.execute(query, tuple(values))
        conn.commit()
    conn.close()

def update_user_password(user_id: int, new_password: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    pwd_hash = hash_password(new_password)
    cursor.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", (pwd_hash, datetime.utcnow().isoformat(), user_id))
    conn.commit()
    conn.close()

def update_user_avatar(user_id: int, image_base64: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET profile_image = ?, updated_at = ? WHERE id = ?", (image_base64, datetime.utcnow().isoformat(), user_id))
    conn.commit()
    conn.close()

def update_last_login(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET last_login = ? WHERE id = ?", (datetime.utcnow().isoformat(), user_id))
    conn.commit()
    conn.close()

# Token/Session Management Logic
def create_session(user_id: int, expiry_hours: int = 24) -> str:
    conn = get_db_connection()
    cursor = conn.cursor()
    session_id = str(uuid.uuid4())
    token = str(uuid.uuid4()) + str(uuid.uuid4())
    expires_at = (datetime.utcnow() + timedelta(hours=expiry_hours)).isoformat()
    
    cursor.execute("INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)",
                   (session_id, user_id, token, expires_at))
    conn.commit()
    conn.close()
    return token

def verify_session(token: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
    SELECT u.* FROM users u
    JOIN sessions s ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > ? AND u.account_status = 'active'
    """, (token, now))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def delete_session(token: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()

# Refresh Token Management
def create_refresh_token(user_id: int, expiry_days: int = 30) -> str:
    conn = get_db_connection()
    cursor = conn.cursor()
    token_id = str(uuid.uuid4())
    token = str(uuid.uuid4()) + "_" + str(uuid.uuid4())
    expires_at = (datetime.utcnow() + timedelta(days=expiry_days)).isoformat()
    
    cursor.execute("INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)",
                   (token_id, user_id, token, expires_at))
    conn.commit()
    conn.close()
    return token

def verify_refresh_token(token: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
    SELECT r.user_id, r.expires_at, r.revoked FROM refresh_tokens r
    JOIN users u ON u.id = r.user_id
    WHERE r.token = ? AND r.expires_at > ? AND r.revoked = 0 AND u.account_status = 'active'
    """, (token, now))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def revoke_refresh_token(token: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE refresh_tokens SET revoked = 1 WHERE token = ?", (token,))
    conn.commit()
    conn.close()

# Password reset token management
def generate_reset_token(user_id: int, expiry_minutes: int = 15) -> str:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Invalidate older tokens
    cursor.execute("UPDATE password_reset_tokens SET used = 1 WHERE user_id = ?", (user_id,))
    
    token = str(uuid.uuid4())[:8].upper() # 8-character code for easy copy-paste
    expires_at = (datetime.utcnow() + timedelta(minutes=expiry_minutes)).isoformat()
    
    cursor.execute("INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)",
                   (token, user_id, expires_at))
    conn.commit()
    conn.close()
    return token

def verify_reset_token(token: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
    SELECT user_id FROM password_reset_tokens
    WHERE token = ? AND expires_at > ? AND used = 0
    """, (token, now))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def invalidate_reset_token(token: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE password_reset_tokens SET used = 1 WHERE token = ?", (token,))
    conn.commit()
    conn.close()

# Initialize DB on import/start
init_db()
print("Auth system SQLite database initialized at", DB_PATH)
