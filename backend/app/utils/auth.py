import hashlib
import secrets


def hash_password(password: str) -> str:
    """Hash a plaintext password using SHA-256 with salt."""
    salt = secrets.token_hex(16)
    digest = hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()
    return f"{salt}${digest}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its hash."""
    try:
        salt, digest = hashed_password.split("$", 1)
    except ValueError:
        return False
    expected = hashlib.sha256(f"{salt}:{plain_password}".encode("utf-8")).hexdigest()
    return secrets.compare_digest(expected, digest)
