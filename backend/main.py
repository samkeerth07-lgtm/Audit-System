from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from routes.auth import router as auth_router

from database import Base, engine, SessionLocal
import models
from schemas import ClientCreate, DocumentCreate, CorrectionRequest

from auth import get_current_user
from models import User

from auth import get_current_user, require_role

from pydantic import BaseModel


from auth import get_current_user, require_role
from models import User

import os

from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)



def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {
        "message": "Mini Audit Document Review System API is running"
    }


@app.get("/clients")
def get_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    clients = db.query(models.Client).filter(
        models.Client.firm_id == current_user.firm_id
    ).all()

    return clients

@app.get("/test-reviewer")
def test_reviewer(
    current_user: User = Depends(require_role("REVIEWER"))
):
    return {
        "message": "Reviewer access granted",
        "user": current_user.name,
        "role": current_user.role
    }

@app.get("/test-staff")
def test_staff(
    current_user: User = Depends(require_role("STAFF"))
):
    return {
        "message": "Staff access granted",
        "user": current_user.name,
        "role": current_user.role
    }

@app.post("/clients")
def create_client(
    data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = models.Client(
        firm_id=current_user.firm_id,
        name=data.name
    )

    db.add(client)
    db.commit()
    db.refresh(client)

    return client

@app.post("/clients/{client_id}/documents")
def create_document(
    client_id: int,
    data: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(models.Client).filter(
        models.Client.id == client_id,
        models.Client.firm_id == current_user.firm_id
    ).first()

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client not found"
        )

    document = models.Document(
        firm_id=current_user.firm_id,
        client_id=client_id,
        name=data.name,
        status="PENDING"
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document

@app.post("/documents/{document_id}/upload")
def upload_document(
    document_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("STAFF"))
):
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.firm_id == current_user.firm_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )
    if document.status not in ["PENDING", "CORRECTION_REQUIRED"]:
        raise HTTPException(
            status_code=400,
            detail="Document cannot be uploaded in its current status"
        )

    existing_version = db.query(
        models.DocumentVersion
    ).filter(
        models.DocumentVersion.document_id == document_id
    ).order_by(
        models.DocumentVersion.version_number.desc()
    ).first()

    if existing_version:
        version_number = existing_version.version_number + 1
    else:
        version_number = 1

    os.makedirs("uploads", exist_ok=True)

    file_path = f"uploads/document_{document_id}_v{version_number}_{file.filename}"

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    version = models.DocumentVersion(
        document_id=document_id,
        uploaded_by=current_user.id,
        file_name=file.filename,
        file_path=file_path,
        version_number=version_number
    )

    db.add(version)

    document.status = "UPLOADED"

    audit_event = models.AuditEvent(
        firm_id=current_user.firm_id,
        document_id=document.id,
        actor_id=current_user.id,
        action="DOCUMENT_UPLOADED",
        comment=None
    )

    db.add(audit_event)

    db.commit()
    db.refresh(version)

    return {
        "message": "Document uploaded successfully",
        "document_id": document.id,
        "file_name": file.filename,
        "version_number": version.version_number,
        "status": document.status
    }

@app.get("/clients/{client_id}/documents")
def get_client_documents(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(models.Client).filter(
        models.Client.id == client_id,
        models.Client.firm_id == current_user.firm_id
    ).first()

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client not found"
        )

    documents = db.query(models.Document).filter(
        models.Document.client_id == client_id,
        models.Document.firm_id == current_user.firm_id
    ).all()

    return documents

@app.get("/review-queue")
def get_review_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("REVIEWER"))
):
    documents = db.query(
        models.Document,
        models.Client
    ).join(
        models.Client,
        models.Client.id == models.Document.client_id
    ).filter(
        models.Document.firm_id == current_user.firm_id,
        models.Client.firm_id == current_user.firm_id,
        models.Document.status.in_(["UPLOADED", "UNDER_REVIEW"])
    ).all()

    queue = []
    for document, client in documents:
        latest_version = db.query(models.DocumentVersion).filter(
            models.DocumentVersion.document_id == document.id
        ).order_by(
            models.DocumentVersion.version_number.desc()
        ).first()

        uploader_name = None
        if latest_version:
            uploader_name = db.query(models.User.name).filter(
                models.User.id == latest_version.uploaded_by,
                models.User.firm_id == current_user.firm_id
            ).scalar()

        latest_upload = db.query(models.AuditEvent).filter(
            models.AuditEvent.document_id == document.id,
            models.AuditEvent.firm_id == current_user.firm_id,
            models.AuditEvent.action == "DOCUMENT_UPLOADED"
        ).order_by(
            models.AuditEvent.created_at.desc(),
            models.AuditEvent.id.desc()
        ).first()

        queue.append({
            "document_id": document.id,
            "document_name": document.name,
            "client_id": client.id,
            "client_name": client.name,
            "status": document.status,
            "uploader": uploader_name,
            "uploaded_at": latest_upload.created_at if latest_upload else None
        })

    return queue

@app.get("/documents/{document_id}")
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.firm_id == current_user.firm_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    client = db.query(models.Client).filter(
        models.Client.id == document.client_id,
        models.Client.firm_id == current_user.firm_id
    ).first()

    latest_correction = db.query(models.AuditEvent).filter(
        models.AuditEvent.document_id == document.id,
        models.AuditEvent.firm_id == current_user.firm_id,
        models.AuditEvent.action == "CORRECTION_REQUESTED"
    ).order_by(
        models.AuditEvent.created_at.desc(),
        models.AuditEvent.id.desc()
    ).first()

    latest_version = db.query(models.DocumentVersion).filter(
        models.DocumentVersion.document_id == document.id
    ).order_by(
        models.DocumentVersion.version_number.desc()
    ).first()

    latest_uploader = None
    if latest_version:
        latest_uploader = db.query(models.User.name).filter(
            models.User.id == latest_version.uploaded_by,
            models.User.firm_id == current_user.firm_id
        ).scalar()

    latest_upload = db.query(models.AuditEvent).filter(
        models.AuditEvent.document_id == document.id,
        models.AuditEvent.firm_id == current_user.firm_id,
        models.AuditEvent.action == "DOCUMENT_UPLOADED"
    ).order_by(
        models.AuditEvent.created_at.desc(),
        models.AuditEvent.id.desc()
    ).first()

    return {
        "id": document.id,
        "firm_id": document.firm_id,
        "client_id": document.client_id,
        "client_name": client.name if client else None,
        "name": document.name,
        "status": document.status,
        "latest_correction_comment": (
            latest_correction.comment if latest_correction else None
        ),
        "current_version": (
            latest_version.version_number if latest_version else None
        ),
        "uploaded_by": latest_uploader,
        "uploaded_at": latest_upload.created_at if latest_upload else None
    }

@app.post("/documents/{document_id}/review/start")
def start_review(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("REVIEWER"))
):
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.firm_id == current_user.firm_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    if document.status != "UPLOADED":
        raise HTTPException(
            status_code=400,
            detail="Only uploaded documents can be reviewed"
        )

    document.status = "UNDER_REVIEW"
    audit_event = models.AuditEvent(
        firm_id=current_user.firm_id,
        document_id=document.id,
        actor_id=current_user.id,
        action="REVIEW_STARTED",
        comment=None
    )

    db.add(audit_event)

    db.commit()
    db.refresh(document)

    return {
        "message": "Document review started",
        "document_id": document.id,
        "status": document.status
    }

@app.post("/documents/{document_id}/approve")
def approve_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("REVIEWER"))
):
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.firm_id == current_user.firm_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    if document.status != "UNDER_REVIEW":
        raise HTTPException(
            status_code=400,
            detail="Only documents under review can be approved"
        )

    document.status = "APPROVED"

    audit_event = models.AuditEvent(
        firm_id=current_user.firm_id,
        document_id=document.id,
        actor_id=current_user.id,
        action="DOCUMENT_APPROVED",
        comment=None
    )

    db.add(audit_event)

    db.commit()
    db.refresh(document)

    return {
        "message": "Document approved",
        "document_id": document.id,
        "status": document.status
    }

@app.get("/documents/{document_id}/audit-history")
def get_audit_history(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("REVIEWER"))
):
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.firm_id == current_user.firm_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    audit_events = db.query(
        models.AuditEvent,
        models.User.name
    ).join(
        models.User,
        models.AuditEvent.actor_id == models.User.id
    ).filter(
        models.AuditEvent.document_id == document.id,
        models.AuditEvent.firm_id == current_user.firm_id
    ).order_by(
        models.AuditEvent.created_at.asc(),
        models.AuditEvent.id.asc()
    ).all()

    return [
        {
            "actor": actor_name,
            "action": audit_event.action,
            "comment": audit_event.comment,
            "created_at": audit_event.created_at,
            "document_id": document.id,
            "document_name": document.name
        }
        for audit_event, actor_name in audit_events
    ]

@app.post("/documents/{document_id}/request-correction")
def request_correction(
    document_id: int,
    data: CorrectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("REVIEWER"))
):
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.firm_id == current_user.firm_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    if document.status != "UNDER_REVIEW":
        raise HTTPException(
            status_code=400,
            detail="Only documents under review can have corrections requested"
        )

    if not data.comment.strip():
        raise HTTPException(
            status_code=400,
            detail="Correction comment is required"
        )

    document.status = "CORRECTION_REQUIRED"

    audit_event = models.AuditEvent(
        firm_id=current_user.firm_id,
        document_id=document.id,
        actor_id=current_user.id,
        action="CORRECTION_REQUESTED",
        comment=data.comment
    )

    db.add(audit_event)

    db.commit()
    db.refresh(document)

    return {
        "message": "Correction requested",
        "document_id": document.id,
        "status": document.status,
        "comment": data.comment
    }

@app.get("/auth/me")
def get_me(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "firm_id": current_user.firm_id
    }