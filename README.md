# Audit-System

### Mini Audit Document Review & Workflow System for CA Firms

A lightweight, role-based audit workflow platform designed for small and mid-sized Chartered Accountant (CA) firms to manage client documents, reviews, corrections, approvals, and a complete audit history in one place.

The system replaces fragmented workflows across **WhatsApp, Excel, Email, and Google Drive** with a structured and traceable document-review process.

---

## 🚀 Overview

Audit work often involves repeatedly collecting documents from clients, checking them, requesting corrections, assigning work, reviewing submissions, and maintaining evidence of what happened.

This project provides a focused workflow for managing that process:

```text
Client
   ↓
Audit Document
   ↓
Staff Upload
   ↓
Reviewer Review
   ↓
 ┌───────────────────────┐
 │                       │
 ▼                       ▼
Approve             Request Correction
 │                       │
 ▼                       ▼
APPROVED             Re-upload
                         │
                         ▼
                    Review Again
                         │
                         ▼
                      APPROVED
```

Every important action is recorded in an **append-only audit history**.

---

## ✨ Key Features

### 🔐 Role-Based Authentication

The system supports two roles:

**Staff**

* View assigned clients
* View client documents
* Upload documents
* Re-upload documents after corrections
* Track document status

**Reviewer**

* View documents awaiting review
* Start document reviews
* Approve documents
* Request corrections with mandatory comments
* View audit history

---

### 🏢 Multi-Tenant Firm Isolation

The application supports multiple CA firms.

Demo firms:

* **ABC & Co.**
* **XYZ & Co.**

Users belonging to one firm cannot access clients or documents belonging to another firm.

Tenant isolation is enforced at the **backend/API level**, not just by hiding information in the frontend.

---

### 📄 Document Workflow

Documents follow a controlled state machine:

```text
PENDING
   ↓
UPLOADED
   ↓
UNDER_REVIEW
   ├──────────────→ APPROVED
   │
   ↓
CORRECTION_REQUIRED
   ↓
UPLOADED
   ↓
UNDER_REVIEW
   ↓
APPROVED
```

This prevents invalid workflow transitions and keeps the review process predictable.

---

### 🔄 Document Versioning

When a staff member re-uploads a document after a correction request, a new document version is created rather than replacing the previous submission.

Example:

```text
Bank Statement

Version 1
Uploaded by Ravi
        ↓
Correction requested
        ↓
Version 2
Uploaded by Ravi
        ↓
Reviewed
        ↓
Approved
```

This preserves the history of document submissions.

---

### 📜 Audit Trail

Important actions are recorded as audit events.

Examples include:

* Document uploaded
* Review started
* Correction requested
* Document re-uploaded
* Document approved

Each event records information such as:

* Actor
* Action
* Timestamp
* Comment/reason where applicable

Audit history is read-only for normal users.

---

### 💬 Correction Requests

Reviewers cannot request a correction without providing a reason.

Example:

> Page 3 is missing. Please upload the complete bank statement.

This ensures that staff members know exactly what needs to be corrected.

---

## 🏗️ Architecture

```text
┌─────────────────────────────┐
│        React Frontend       │
│      TypeScript + CSS       │
└──────────────┬──────────────┘
               │ REST API
               ▼
┌─────────────────────────────┐
│       FastAPI Backend       │
│                             │
│ Authentication              │
│ Authorization               │
│ Workflow Validation         │
│ Tenant Isolation            │
│ Document Management         │
│ Audit Logging               │
└──────────────┬──────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
┌──────────────┐ ┌──────────────┐
│   SQLite     │ │ File Storage │
│              │ │              │
│ Firms        │ │ Uploaded     │
│ Users        │ │ documents    │
│ Clients      │ │ & versions   │
│ Documents    │ │              │
│ Versions     │ │              │
│ Audit Events │ │              │
└──────────────┘ └──────────────┘
```

### Technology Stack

| Layer           | Technology        |
| --------------- | ----------------- |
| Frontend        | React             |
| Language        | TypeScript        |
| Styling         | CSS               |
| Backend         | FastAPI           |
| ORM             | SQLAlchemy        |
| Database        | SQLite            |
| Authentication  | JWT               |
| API             | REST              |
| File Uploads    | FastAPI Multipart |
| Deployment      | Render            |
| Version Control | Git + GitHub      |

---

## 🗂️ Project Structure

```text
Audit-System/
│
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── auth.py
│   ├── seed.py
│   │
│   └── routes/
│       └── auth.py
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── Login.tsx
│   │   ├── App.css
│   │   └── api.ts
│   │
│   ├── package.json
│   └── ...
│
├── requirements.txt
├── .gitignore
└── README.md
```

---

## 🗄️ Data Model

The core data model consists of:

### Firm

Represents a CA firm using the platform.

```text
Firm
 ├── Users
 └── Clients
```

### User

Represents a staff member or reviewer.

```text
User
 ├── firm_id
 ├── name
 ├── email
 └── role
```

### Client

Represents a client belonging to a firm.

```text
Client
 ├── firm_id
 └── name
```

### Document

Represents an audit document associated with a client.

```text
Document
 ├── firm_id
 ├── client_id
 ├── name
 └── status
```

### Document Version

Represents each uploaded version of a document.

```text
DocumentVersion
 ├── document_id
 ├── uploaded_by
 ├── file_name
 ├── file_path
 └── version_number
```

### Audit Event

Represents an immutable workflow event.

```text
AuditEvent
 ├── firm_id
 ├── document_id
 ├── actor_id
 ├── action
 ├── comment
 └── created_at
```

---

## 🔑 API Overview

### Authentication

```http
POST /auth/login
GET  /auth/me
```

### Clients

```http
GET  /clients
POST /clients
GET  /clients/{client_id}
```

### Documents

```http
GET  /clients/{client_id}/documents
POST /clients/{client_id}/documents

GET  /documents/{document_id}

POST /documents/{document_id}/upload
```

### Review Workflow

```http
POST /documents/{document_id}/review/start

POST /documents/{document_id}/request-correction

POST /documents/{document_id}/approve
```

### Audit History

```http
GET /documents/{document_id}/audit-history
```

---

## 👥 Demo Accounts

The application includes two demo firms.

### ABC & Co.

| User | Role     | Email          | Password |
| ---- | -------- | -------------- | -------- |
| Ravi | Staff    | `ravi@abc.com` | `demo`   |
| Anil | Reviewer | `anil@abc.com` | `demo`   |

### XYZ & Co.

| User  | Role     | Email           | Password |
| ----- | -------- | --------------- | -------- |
| Priya | Staff    | `priya@xyz.com` | `demo`   |
| Meena | Reviewer | `meena@xyz.com` | `demo`   |

> These credentials are intended for demonstration/evaluation purposes only.

---

## 🧪 Example Workflow

### 1. Staff Upload

Ravi logs in and opens:

```text
ABC & Co.
   ↓
ABC Traders Pvt. Ltd.
   ↓
Audit Documents
```

He uploads a document.

Status:

```text
PENDING → UPLOADED
```

---

### 2. Reviewer Starts Review

Anil logs in as a reviewer and opens the review queue.

He starts reviewing the document.

```text
UPLOADED → UNDER_REVIEW
```

---

### 3. Correction Required

If the document is incomplete, Anil requests a correction.

Example:

```text
Page 3 is missing.
Please upload the complete bank statement.
```

Status:

```text
UNDER_REVIEW → CORRECTION_REQUIRED
```

---

### 4. Staff Re-upload

Ravi receives the correction requirement and uploads a corrected version.

```text
CORRECTION_REQUIRED → UPLOADED
```

A new document version is created.

---

### 5. Final Approval

Anil reviews the corrected version.

```text
UPLOADED
    ↓
UNDER_REVIEW
    ↓
APPROVED
```

---

### 6. Audit History

The complete sequence remains available:

```text
Ravi    → DOCUMENT_UPLOADED
Anil    → REVIEW_STARTED
Anil    → CORRECTION_REQUESTED
Ravi    → DOCUMENT_UPLOADED
Anil    → REVIEW_STARTED
Anil    → DOCUMENT_APPROVED
```

This provides a traceable record of what happened to the document.

---

## 🔒 Security Design

Security is implemented at the backend rather than relying solely on frontend visibility.

### Authentication

Users authenticate using credentials and receive a JWT access token.

The token is used for protected API requests.

### Authorization

Role-based permissions are enforced by the backend.

For example:

```text
STAFF
 ├── Upload documents
 └── Cannot approve documents

REVIEWER
 ├── Review documents
 ├── Request corrections
 └── Approve documents
```

### Tenant Isolation

Every relevant operation is scoped using the authenticated user's `firm_id`.

Conceptually:

```python
document.firm_id == current_user.firm_id
```

This prevents users from one firm from accessing another firm's data.

### Audit Integrity

Audit events are created by the backend as workflow actions occur.

Users do not receive an API operation for editing or deleting historical audit events.

---

## 📦 Synthetic Finance Data

The project uses synthetic finance data for evaluation and demonstration.

The synthetic dataset is mapped to the application's audit workflow rather than being treated as the application's database model.

For example:

```text
Synthetic Finance Data
        ↓
Invoices / Statements / Financial Documents
        ↓
Audit-System Document
        ↓
Upload → Review → Correction → Approval
```

The application adds its own workflow metadata such as:

* Firm
* Client
* Uploader
* Upload time
* Version
* Status
* Review comments
* Audit events

---

## 💻 Local Development

### Prerequisites

Make sure you have:

* Python 3.10+
* Node.js
* npm
* Git

---

### Clone the Repository

```bash
git clone https://github.com/samkeerth07-lgtm/Audit-System.git
cd Audit-System
```

---

### Backend Setup

```powershell
cd backend

python -m venv venv

.\venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r ..\requirements.txt
```

Run the backend:

```powershell
uvicorn main:app --reload --port 8001
```

The API will be available at:

```text
http://127.0.0.1:8001
```

Swagger API documentation:

```text
http://127.0.0.1:8001/docs
```

> Port `8001` is used for local development in this project because port `8000` may already be occupied or restricted on some Windows environments.

---

### Frontend Setup

Open another terminal:

```powershell
cd frontend

npm install

npm run dev
```

The Vite development server will provide the frontend URL shown in the terminal.

---

## 🌐 Deployment

The backend is deployed using Render.

Production API:

```text
https://audit-system-eibg.onrender.com
```

Swagger documentation:

```text
https://audit-system-eibg.onrender.com/docs
```

The frontend is configured to communicate with the deployed backend API.

---

## 🎯 Design Decisions

This project intentionally focuses on the **core audit workflow** instead of trying to become a complete accounting platform.

### Included

* Client management
* Document management
* Role-based workflow
* Document versioning
* Review and approval
* Correction cycles
* Audit history
* Multi-firm isolation

### Intentionally excluded

The project does not attempt to implement:

* GST filing
* Tax calculation
* WhatsApp automation
* Government portal automation
* Advanced OCR
* AI audit agents
* Payments
* Mobile applications
* Complex analytics

This keeps the prototype focused on the actual audit document-review problem.

---

## 🧠 Product Philosophy

The system is designed around three principles:

### 1. Every document has a state

A document should never be ambiguously "done."

Its status clearly communicates where it is in the workflow.

### 2. Every important action leaves evidence

Reviewers and staff should be able to understand what happened without relying on memory, WhatsApp messages, or scattered spreadsheets.

### 3. Security belongs in the backend

The frontend controls the user experience, but the backend controls access to data.

This is particularly important in a multi-firm environment where tenant isolation is required.

---

## 📊 Evaluation Coverage

The implementation directly addresses the major evaluation areas:

| Evaluation Area     | Implementation                                   |
| ------------------- | ------------------------------------------------ |
| Core Workflow       | Client → Upload → Review → Correction → Approval |
| Audit Trail         | Immutable workflow events                        |
| Backend/Data Design | FastAPI + SQLAlchemy + SQLite                    |
| Tenant Isolation    | Firm-scoped backend authorization                |
| Code Quality        | Modular frontend/backend structure               |
| UI/Usability        | Role-specific dashboards and workflow views      |
| Architecture        | React → FastAPI → Database/File Storage          |
| Product Judgment    | Focused workflow without unrelated features      |

---

## 🔮 Possible Future Improvements

The current implementation intentionally remains a focused prototype.

Potential future improvements include:

* Secure password hashing
* PostgreSQL for production deployments
* Cloud object storage for documents
* More granular permissions
* Secure signed file URLs
* Automated testing and CI/CD
* Email notifications
* Advanced document search
* Production-grade secret management

These are deliberately kept outside the core prototype so that the essential workflow remains simple and demonstrable.

---

## 👨‍💻 Author

**Samkeerth**

B.Tech — Artificial Intelligence & Data Science

VVIT

---

## 📌 Repository

**GitHub:**
https://github.com/samkeerth07-lgtm/Audit-System

---

## 📄 Project Status

**Status: Functional Prototype**

The current implementation supports the complete core audit document workflow:

```text
Authentication
      ↓
Client Management
      ↓
Document Upload
      ↓
Review
      ↓
Correction
      ↓
Re-upload
      ↓
Approval
      ↓
Audit History
```

Built as a focused technical prototype for evaluating how a structured audit workflow can replace fragmented document-review processes.
