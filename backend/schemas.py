from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class ClientCreate(BaseModel):
    name: str


class DocumentCreate(BaseModel):
    name: str


class CorrectionRequest(BaseModel):
    comment: str