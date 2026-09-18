from datetime import datetime, timedelta

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User


SECRET_KEY = "change-this-secret-later"
ALGORITHM = "HS256"

security = HTTPBearer()


def create_access_token(user_id: int):
    expire = datetime.utcnow() + timedelta(hours=1)

    data = {
        "user_id": user_id,
        "exp": expire
    }

    return jwt.encode(
        data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user

def require_role(required_role: str):

    def role_checker(
        current_user: User = Depends(get_current_user)
    ):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to perform this action"
            )

        return current_user

    return role_checker