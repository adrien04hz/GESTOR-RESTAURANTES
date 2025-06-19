from jose import jwt, JWTError
from datetime import datetime, timedelta
import bcrypt

SECRET_KEY = "gUdNyO4jAZJn+Ec/YQjdtFEpk180HZtvJH/kI0Miqg4="
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

#hashing de contras
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

#JWT para inicios de sesion
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    ))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None