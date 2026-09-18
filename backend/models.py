from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from database import Base


class Firm(Base):
    __tablename__ = "firms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firm_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    firm_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    firm_id = Column(Integer, nullable=False)

    client_id = Column(Integer, nullable=False)

    name = Column(String, nullable=False)

    status = Column(String, nullable=False, default="PENDING")

class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(Integer, primary_key=True, index=True)

    document_id = Column(Integer, nullable=False)

    uploaded_by = Column(Integer, nullable=False)

    file_name = Column(String, nullable=False)

    file_path = Column(String, nullable=False)

    version_number = Column(Integer, nullable=False)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)

    firm_id = Column(
        Integer,
        ForeignKey("firms.id"),
        nullable=False
    )

    document_id = Column(
        Integer,
        ForeignKey("documents.id"),
        nullable=False
    )

    actor_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    action = Column(String, nullable=False)

    comment = Column(String, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )