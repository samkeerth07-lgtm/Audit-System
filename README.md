# 📋 Mini Audit Document Review System

A role-based audit document workflow system designed for **small and mid-sized Chartered Accountant (CA) firms**.

The system centralizes client document collection, document uploads, review, correction requests, re-uploads, approvals, document versioning, and audit history into a single workflow.

Instead of managing audit documents across spreadsheets, emails, messaging applications, shared folders, and manual follow-ups, the system provides a structured and traceable review process.

---

## 🌐 Live Demo

### Frontend

**https://audit-system-blush-five.vercel.app**

### Backend API

**https://audit-system-eibg.onrender.com**

### API Documentation

**https://audit-system-eibg.onrender.com/docs**

> The frontend is deployed on Vercel and communicates with the FastAPI backend deployed on Render.

---

## 🎯 Project Overview

Audit documentation involves more than simply uploading files.

A typical workflow requires:

1. Collecting documents from clients
2. Assigning or tracking documents
3. Uploading submitted files
4. Reviewing submitted documents
5. Identifying missing or incorrect information
6. Requesting corrections
7. Uploading corrected versions
8. Reviewing again
9. Approving the document
10. Maintaining a history of everything that happened

The **Mini Audit Document Review System** models this workflow as a controlled digital process.

The system is intentionally focused on the core audit-document workflow rather than attempting to become a complete accounting or taxation platform.

---

# 🚨 Problem Statement

Small and mid-sized CA firms may manage audit documentation through a combination of:

* WhatsApp
* Excel
* Email
* Google Drive
* Shared folders
* Manual follow-ups

This fragmented workflow can make it difficult to determine:

* Which documents have been submitted
* Which documents are still pending
* Who uploaded a document
* When a document was uploaded
* Who reviewed it
* Whether a document was approved
* Why a document was rejected or sent for correction
* Which version is the latest
* What happened to the document previously
* Who performed each action

The system addresses this problem by providing a centralized document review workflow with **role-based access, document versioning, correction handling, and audit history**.

---

# 💡 Solution

The application provides a simple workflow:

```text
Client
   │
   ▼
Document
   │
   ▼
Upload
   │
   ▼
Review
   │
   ├───────────────┐
   │               │
   ▼               ▼
Approve       Request Correction
   │               │
   ▼               ▼
APPROVED      CORRECTION_REQUIRED
                   │
                   ▼
              Re-upload
                   │
                   ▼
                Review
                   │
                   ▼
                Approve
```

Every important action is recorded in the audit history.

---

# ✨ Key Features

## 👥 Client Management

Users can manage clients belonging to their own firm.

Capabilities include:

* View clients
* Create clients
* Open a client workspace
* View documents associated with a client

Client access is restricted by firm.

---

## 📄 Document Management

Documents are associated with:

* A firm
* A client
* A document name
* A workflow status

The system allows staff members to upload documents and reviewers to process them through the review workflow.

---

## 🔄 Controlled Document Workflow

Documents follow a defined state machine.

### Initial Workflow

```text
PENDING
   ↓
UPLOADED
   ↓
UNDER_REVIEW
   ↓
APPROVED
```

### Correction Workflow

```text
UNDER_REVIEW
      ↓
CORRECTION_REQUIRED
      ↓
UPLOADED
      ↓
UNDER_REVIEW
      ↓
APPROVED
```

This ensures that a document does not simply jump directly from upload to approval.

---

# 📊 Document Statuses

| Status                | Meaning                                            |
| --------------------- | -------------------------------------------------- |
| `PENDING`             | Document is expected but has not yet been uploaded |
| `UPLOADED`            | A document version has been submitted              |
| `UNDER_REVIEW`        | Reviewer is currently reviewing the document       |
| `CORRECTION_REQUIRED` | Reviewer found an issue and requested a correction |
| `APPROVED`            | Reviewer has approved the document                 |

---

# 📝 Correction Requests

When a reviewer identifies an issue, they can request a correction.

A correction request requires a comment.

Example:

> Page 3 is missing. Please upload the complete bank statement.

The document then moves to:

```text
CORRECTION_REQUIRED
```

The staff member can upload the corrected document.

The corrected upload becomes a **new document version** rather than replacing the previous version.

---

# 🔢 Document Versioning

The system preserves document versions.

For example:

```text
Bank_Statement
│
├── Version 1
│
├── Version 2
│
└── Version 3
```

A correction does not overwrite the previous submission.

Instead:

```text
Version 1
   ↓
Reviewer requests correction
   ↓
Version 2 uploaded
   ↓
Reviewer reviews Version 2
```

This provides traceability throughout the document lifecycle.

---

# 📜 Audit History

Audit history is one of the core parts of the application.

Important workflow events are recorded with information such as:

* Actor
* Action
* Document
* Timestamp
* Comment/reason where applicable

Example:

```text
09:30 AM
Ravi uploaded Bank Statement
        │
        ▼
10:15 AM
Anil started review
        │
        ▼
10:20 AM
Anil requested correction
"Page 3 is missing."
        │
        ▼
11:05 AM
Ravi uploaded Version 2
        │
        ▼
11:30 AM
Anil approved the document
```

The audit history is intended to be **append-only** from the perspective of normal users.

Users do not receive an interface for editing historical audit events.

---

# 👤 User Roles

The system contains two primary roles:

* Staff
* Reviewer

---

## 👨‍💻 Staff

Staff members are responsible for document submission and responding to corrections.

### Staff capabilities

* Login
* View their firm's clients
* Create clients
* View client documents
* Upload documents
* Upload corrected document versions
* View document status
* View document history

### Staff restrictions

Staff users cannot:

* Approve documents
* Request corrections
* Perform reviewer-only actions

---

# 🧑‍⚖️ Reviewer

Reviewers are responsible for processing submitted documents.

### Reviewer capabilities

* Login
* View their firm's clients
* View review queue
* View documents
* Start document review
* Approve documents
* Request corrections
* Add correction comments
* View audit history

---

# 🔐 Multi-Tenant Architecture

The system supports multiple firms inside the same application.

Demo firms include:

```text
ABC & Co.
XYZ & Co.
```

Users belong to a firm.

Clients belong to a firm.

Documents belong to a firm.

This allows the application to enforce firm-level data isolation.

---

## 🛡️ Tenant Isolation

For example:

```text
ABC & Co.

ABC Staff
    │
    ├── ABC Clients       ✅
    ├── ABC Documents     ✅
    └── XYZ Documents     ❌
```

Similarly:

```text
XYZ & Co.

XYZ Staff
    │
    ├── XYZ Clients       ✅
    ├── XYZ Documents     ✅
    └── ABC Documents     ❌
```

The isolation is enforced by the backend.

The application does not rely solely on hiding UI elements.

A user attempting to access another firm's resource through a modified request should be rejected by the backend authorization layer.

---

# 🔑 Authentication

Authentication uses **JWT-based access tokens**.

The general authentication flow is:

```text
User Login
     │
     ▼
Credentials Verified
     │
     ▼
JWT Access Token Generated
     │
     ▼
Frontend Stores Token
     │
     ▼
Token Sent With API Requests
     │
     ▼
Backend Validates Token
     │
     ▼
Current User Identified
```

---

# 🔒 Authorization

Authentication and authorization are treated as separate concerns.

### Authentication

Answers:

> Who is the user?

### Authorization

Answers:

> What is the user allowed to do?

The backend checks:

* User identity
* User role
* User's firm
* Requested resource
* Requested operation

before allowing protected operations.

The frontend is responsible for user experience and navigation, while the backend acts as the actual authorization boundary.

---

# 🏗️ System Architecture

```text
┌────────────────────────────────────┐
│             FRONTEND               │
│                                    │
│       React + TypeScript + Vite    │
│                                    │
│              Vercel                │
└──────────────────┬─────────────────┘
                   │
                   │ HTTPS / REST API
                   ▼
┌────────────────────────────────────┐
│              BACKEND               │
│                                    │
│               FastAPI              │
│                                    │
│  Authentication                    │
│  Authorization                     │
│  Tenant Isolation                  │
│  Client Management                 │
│  Document Workflow                 │
│  Review Workflow                   │
│  Audit History                     │
│                                    │
│              Render                │
└──────────────────┬─────────────────┘
                   │
                   ▼
┌────────────────────────────────────┐
│            SQLAlchemy              │
│               ORM                  │
└──────────────────┬─────────────────┘
                   │
                   ▼
┌────────────────────────────────────┐
│              SQLite                │
│          Prototype Database        │
└────────────────────────────────────┘

                   +
                   
┌────────────────────────────────────┐
│          File Storage              │
│                                    │
│       Uploaded Documents           │
└────────────────────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

| Technology | Purpose                            |
| ---------- | ---------------------------------- |
| React      | UI development                     |
| TypeScript | Type-safe frontend development     |
| Vite       | Frontend development/build tooling |
| CSS        | UI styling                         |

## Backend

| Technology | Purpose                  |
| ---------- | ------------------------ |
| Python     | Backend language         |
| FastAPI    | REST API framework       |
| SQLAlchemy | ORM/database interaction |
| JWT        | Authentication           |
| Pydantic   | Request/data validation  |

## Database

| Technology | Purpose                       |
| ---------- | ----------------------------- |
| SQLite     | Prototype relational database |

## Deployment

| Platform | Component |
| -------- | --------- |
| Vercel   | Frontend  |
| Render   | Backend   |

---

# 🗃️ Data Model

The core data model consists of:

```text
                 ┌──────────────┐
                 │     Firm     │
                 └──────┬───────┘
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
        ┌──────────┐        ┌──────────┐
        │   User   │        │  Client  │
        └──────────┘        └────┬─────┘
                                 │
                                 ▼
                          ┌────────────┐
                          │  Document  │
                          └─────┬──────┘
                                │
                       ┌────────┴────────┐
                       ▼                 ▼
              ┌────────────────┐  ┌───────────────┐
              │Document Version│  │ Audit Event   │
              └────────────────┘  └───────────────┘
```

---

## Firm

Represents a CA firm using the platform.

Example:

```text
ABC & Co.
XYZ & Co.
```

---

## User

Represents an authenticated application user.

Relevant information includes:

* Name
* Email
* Password credential
* Role
* Firm

---

## Client

Represents an audit client belonging to a firm.

---

## Document

Represents a document required for or submitted during an audit.

A document is associated with:

* Firm
* Client
* Name
* Current status

---

## Document Version

Represents an individual uploaded version of a document.

A version records information such as:

* Document
* Uploader
* File name
* File path
* Version number

---

## Audit Event

Represents an event in the document lifecycle.

An audit event records:

* Firm
* Document
* Actor
* Action
* Comment
* Timestamp

---

# 🔌 API

The backend exposes REST APIs through FastAPI.

Interactive API documentation is available at:

https://audit-system-eibg.onrender.com/docs

---

## Authentication

### Login

```http
POST /auth/login
```

Authenticates a user and returns an access token.

### Current User

```http
GET /auth/me
```

Returns information about the authenticated user.

---

# 👥 Client APIs

### List Clients

```http
GET /clients
```

Returns clients accessible to the authenticated user.

### Create Client

```http
POST /clients
```

Creates a client associated with the user's firm.

### Get Client

```http
GET /clients/{client_id}
```

Returns a specific client after authorization checks.

---

# 📄 Document APIs

### List Client Documents

```http
GET /clients/{client_id}/documents
```

Returns documents belonging to a client.

### Create Document

```http
POST /clients/{client_id}/documents
```

Creates a document record.

### Get Document

```http
GET /documents/{document_id}
```

Returns document details.

### Upload Document

```http
POST /documents/{document_id}/upload
```

Uploads a document version.

---

# 🔎 Review APIs

### Review Queue

```http
GET /review-queue
```

Returns documents available to the reviewer.

### Start Review

```http
POST /documents/{document_id}/review/start
```

Moves the document into the review process.

### Approve Document

```http
POST /documents/{document_id}/approve
```

Approves a document.

### Request Correction

```http
POST /documents/{document_id}/request-correction
```

Requests a correction and records the review comment.

---

# 📜 Audit API

### Get Audit History

```http
GET /documents/{document_id}/audit-history
```

Returns the recorded history for a document.

---

# 🧪 Demo Accounts

The prototype includes two firms and four demonstration users.

## ABC & Co.

### Staff

```text
Name: Ravi
Email: ravi@abc.com
Password: demo
Role: STAFF
```

### Reviewer

```text
Name: Anil
Email: anil@abc.com
Password: demo
Role: REVIEWER
```

---

## XYZ & Co.

### Staff

```text
Name: Priya
Email: priya@xyz.com
Password: demo
Role: STAFF
```

### Reviewer

```text
Name: Meena
Email: meena@xyz.com
Password: demo
Role: REVIEWER
```

> These credentials are demonstration credentials for the prototype.

---

# 🧑‍💼 Example Clients

The seeded demonstration environment contains clients associated with the respective firms.

Example:

```text
ABC & Co.
└── ABC Traders Pvt. Ltd.

XYZ & Co.
└── XYZ Enterprises Pvt. Ltd.
```

The backend associates clients with their corresponding firm.

---

# 🔄 End-to-End Example

Consider:

```text
Firm:
ABC & Co.

Client:
ABC Traders Pvt. Ltd.

Document:
Bank Statement
```

---

## Step 1 — Document Required

The document starts as:

```text
PENDING
```

---

## Step 2 — Staff Uploads

Ravi uploads the bank statement.

```text
UPLOADED
```

A document version is created.

```text
Version 1
```

---

## Step 3 — Reviewer Starts Review

Anil starts reviewing the document.

```text
UNDER_REVIEW
```

---

## Step 4 — Correction Required

Suppose the reviewer discovers a missing page.

The reviewer enters:

```text
Page 3 is missing.
Please upload the complete bank statement.
```

The document becomes:

```text
CORRECTION_REQUIRED
```

---

## Step 5 — Staff Re-uploads

Ravi uploads the corrected document.

The application creates:

```text
Version 2
```

The document returns to:

```text
UPLOADED
```

---

## Step 6 — Review Again

Anil reviews Version 2.

```text
UNDER_REVIEW
```

---

## Step 7 — Approval

If the document is acceptable:

```text
APPROVED
```

The audit history retains the sequence of actions.

---

# 📚 Audit Trail Example

A document's history may conceptually look like:

| Time  | Actor | Action               | Comment           |
| ----- | ----- | -------------------- | ----------------- |
| 09:30 | Ravi  | Uploaded             | Version 1         |
| 10:15 | Anil  | Review Started       | —                 |
| 10:20 | Anil  | Correction Requested | Page 3 is missing |
| 11:05 | Ravi  | Uploaded             | Version 2         |
| 11:30 | Anil  | Approved             | —                 |

This provides traceability without requiring users to manually maintain a separate spreadsheet.

---

# 🧩 Synthetic Finance Data

The system is intended to work with synthetic finance data for evaluation and demonstration.

The referenced synthetic finance dataset contains examples of financial artifacts such as:

* Chart of accounts
* Employee/payroll information
* General ledger records
* Purchase invoices
* GST-related information
* Lease schedules
* PDF tax invoices

These datasets provide realistic sample material that can represent documents being processed through the audit workflow.

The synthetic finance dataset itself does not define the application's workflow entities.

The application adds its own domain model:

```text
Firm
User
Client
Document
Document Version
Audit Event
```

This separation keeps the financial sample data independent from the application's workflow and authorization model.

---

# 🔐 Security Model

Security is primarily enforced by the backend.

## 1. Authentication

Users must authenticate before accessing protected resources.

JWT tokens are used to identify authenticated users.

---

## 2. Role Authorization

Operations are restricted based on role.

For example:

```text
STAFF
 ├── Upload
 ├── View
 └── Respond to corrections

REVIEWER
 ├── View
 ├── Start review
 ├── Request correction
 └── Approve
```

---

## 3. Firm Isolation

The authenticated user's firm is used when checking access to clients and documents.

A user from:

```text
ABC & Co.
```

should not be able to retrieve:

```text
XYZ & Co.
```

resources by simply changing an ID in an API request.

---

## 4. Backend as Security Boundary

Frontend restrictions are primarily for usability.

The backend performs the actual authorization checks.

This is important because a malicious user can bypass frontend controls by manually sending HTTP requests.

---

## 5. Audit Events

Workflow actions are recorded as audit events.

This creates a historical record of:

```text
WHO
WHAT
WHEN
DOCUMENT
COMMENT
```

---

# 🧠 Important Design Decisions

## Why a Controlled Workflow?

A document review process benefits from explicit states.

Without controlled states, users could potentially:

```text
Upload → Approve
```

without demonstrating that a review actually occurred.

The workflow makes the expected process explicit:

```text
Upload
  ↓
Review
  ↓
Approve
```

with correction handling when required.

---

## Why Version Documents?

A corrected document should not erase the previous submission.

Versioning preserves the progression:

```text
Version 1
   ↓
Correction Requested
   ↓
Version 2
   ↓
Approval
```

This is particularly useful when traceability matters.

---

## Why Audit Events?

The audit trail makes the system more than a basic file-upload application.

It provides a historical record of actions performed on documents.

The central questions become answerable:

```text
Who performed the action?
What did they do?
When did they do it?
Which document did it affect?
Why was the action performed?
```

---

## Why SQLite?

SQLite keeps the prototype simple and easy to run.

It is appropriate for demonstrating:

* Relational data modelling
* Workflow state
* Authorization
* Document metadata
* Audit events

The application uses SQLAlchemy as its ORM layer, which keeps database access separated from the application logic.

---

## Why FastAPI?

FastAPI provides:

* REST API development
* Request validation
* Dependency injection
* Authentication integration
* Automatic OpenAPI documentation
* Interactive Swagger UI

---

## Why React + TypeScript?

React provides a component-based frontend architecture.

TypeScript provides stronger type safety and makes the frontend easier to maintain as the application grows.

---

# 📁 Repository Structure

```text
Audit-System/
│
├── backend/
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   │
│   └── routes/
│       ├── auth.py
│       ├── clients.py
│       └── documents.py
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── Login.tsx
│   │   └── api.ts
│   │
│   └── package.json
│
├── .gitignore
├── requirements.txt
└── README.md
```

> The exact file structure may evolve as the project develops. The README focuses on the current application architecture.

---

# 🚀 Local Development

## Prerequisites

Make sure the following are installed:

* Python 3.x
* Node.js
* npm
* Git

---

# ⚙️ Backend Setup

Clone the repository:

```bash
git clone https://github.com/samkeerth07-lgtm/Audit-System.git
```

Move into the project:

```bash
cd Audit-System
```

Move into the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r ../requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload --port 8001
```

Backend:

```text
http://127.0.0.1:8001
```

Swagger documentation:

```text
http://127.0.0.1:8001/docs
```

---

# 🎨 Frontend Setup

Open another terminal.

Move into the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🌍 Deployment Architecture

The current deployed architecture is:

```text
                   INTERNET
                       │
                       ▼
          ┌──────────────────────┐
          │        Vercel        │
          │                      │
          │ React + TypeScript   │
          └──────────┬───────────┘
                     │
                     │ HTTPS
                     ▼
          ┌──────────────────────┐
          │       Render         │
          │                      │
          │      FastAPI         │
          └──────────┬───────────┘
                     │
              ┌──────┴──────┐
              ▼             ▼
        ┌──────────┐   ┌─────────────┐
        │  SQLite  │   │ File Storage│
        └──────────┘   └─────────────┘
```

---

# 🔗 Deployment URLs

| Component | URL                                         |
| --------- | ------------------------------------------- |
| Frontend  | https://audit-system-blush-five.vercel.app  |
| Backend   | https://audit-system-eibg.onrender.com      |
| Swagger   | https://audit-system-eibg.onrender.com/docs |

---

# 🌐 CORS Configuration

The backend allows the deployed frontend origin as well as local development origins.

Development:

```text
http://localhost:5173
http://127.0.0.1:5173
```

Production:

```text
https://audit-system-blush-five.vercel.app
```

The application does not rely on a wildcard frontend origin for the deployed application.

---

# 📦 Dependencies

Backend dependencies are maintained in:

```text
requirements.txt
```

Frontend dependencies are maintained in:

```text
frontend/package.json
```

The repository also excludes development/generated files such as:

```text
venv/
__pycache__/
*.pyc
.env
*.db
uploads/
node_modules/
frontend/dist/
.vscode/
```

through `.gitignore`.

---

# 🧪 Testing the Workflow

A basic manual test flow can be performed using the deployed application.

### Test 1 — Staff Login

Login as:

```text
ravi@abc.com
```

Verify that the user can access ABC & Co. data.

---

### Test 2 — Reviewer Login

Login as:

```text
anil@abc.com
```

Verify reviewer functionality.

---

### Test 3 — Document Upload

Create/select a client and upload a document.

Verify:

```text
PENDING → UPLOADED
```

---

### Test 4 — Start Review

As reviewer:

```text
UPLOADED → UNDER_REVIEW
```

---

### Test 5 — Request Correction

Enter a non-empty correction comment.

Verify:

```text
UNDER_REVIEW → CORRECTION_REQUIRED
```

---

### Test 6 — Re-upload

Login as staff and upload the corrected document.

Verify that a new version is created.

---

### Test 7 — Approve

Return to the reviewer account.

Verify:

```text
UNDER_REVIEW → APPROVED
```

---

### Test 8 — Audit History

Open the audit history.

Verify that the workflow actions are recorded in chronological order.

---

### Test 9 — Tenant Isolation

Login using an ABC & Co. account.

Attempt to access an XYZ & Co. client/document.

The backend should reject unauthorized cross-firm access.

---

# 📊 Evaluation Coverage

The project is designed around the core requirements of the audit workflow assignment.

| Evaluation Area     | Implementation                                   |
| ------------------- | ------------------------------------------------ |
| Core workflow       | Client → Upload → Review → Correction → Approval |
| Audit trail         | Audit event records                              |
| Backend/data design | FastAPI + SQLAlchemy + relational models         |
| Security            | JWT + role authorization + firm isolation        |
| Code organization   | Separate backend/frontend structure              |
| UI/usability        | React-based role-specific interface              |
| Architecture        | React → FastAPI → SQLAlchemy → SQLite            |
| Product judgement   | Focused audit-document workflow                  |

---

# 🚫 Deliberate Scope Limitations

The system intentionally does not attempt to become a complete CA practice-management platform.

The current scope excludes:

* WhatsApp automation
* GST filing
* Tax calculation
* Government portal automation
* OCR
* Advanced AI agents
* Mobile application
* Payments
* Complex analytics
* Large-scale enterprise infrastructure

These exclusions are deliberate.

The objective is to deliver a focused, working workflow rather than a large collection of incomplete features.

---

# 🎯 Product Philosophy

The core product principle is:

> **Make audit document review structured, traceable, and role-aware without making the system unnecessarily complex.**

The application focuses on one complete workflow:

```text
CLIENT
   ↓
DOCUMENT
   ↓
UPLOAD
   ↓
REVIEW
   ↓
CORRECTION
   ↓
RE-UPLOAD
   ↓
REVIEW
   ↓
APPROVAL
   ↓
AUDIT HISTORY
```

Each major technical decision supports this workflow.

---

# 🔮 Future Improvements

The following improvements could be considered for a production-oriented version:

### Security

* Secure password hashing
* Secret management through environment variables
* Refresh-token strategy
* Stronger file validation
* Rate limiting
* CSRF/security hardening where applicable

### Database

* PostgreSQL
* Alembic migrations
* Proper database indexing
* Database constraints and relationships

### File Storage

* Object storage such as S3-compatible storage
* File integrity checks
* Malware scanning
* Secure signed download URLs

### Testing

* Backend unit tests
* API integration tests
* Authorization tests
* Tenant-isolation tests
* Frontend component tests
* End-to-end workflow tests

### Product

* Reviewer assignment
* Client-side document submission
* Notification system
* Due dates
* Search and filtering
* More detailed reporting

These are future considerations and are not required for the current prototype.

---

# ⚠️ Prototype Considerations

This project is a functional prototype.

The current architecture prioritizes:

* Clear workflow
* Demonstrable authorization
* Simple data modelling
* Auditability
* Easy development
* Easy deployment

A production implementation would require additional security, infrastructure, testing, observability, storage, and operational controls.

---

# 📌 Project Status

**Status: Functional Prototype**

The current system demonstrates:

* Authentication
* Role-based access
* Client management
* Document management
* Document upload
* Document versioning
* Review workflow
* Correction workflow
* Document approval
* Audit history
* Multi-firm tenant isolation
* REST APIs
* Swagger documentation
* Vercel frontend deployment
* Render backend deployment

---

# 👨‍💻 Author

**Samkeerth**

B.Tech — Artificial Intelligence & Data Science

GitHub:

https://github.com/samkeerth07-lgtm

Repository:

https://github.com/samkeerth07-lgtm/Audit-System

---

# 📄 License

This project is currently developed as a prototype for evaluation and demonstration purposes.

If the project is later released as an open-source project, an explicit open-source license can be added here.

---

## ⭐ Final Summary

The **Mini Audit Document Review System** is a focused audit workflow application that demonstrates how a CA firm's document review process can be centralized into a structured system.

Instead of treating the application as a simple file-upload platform, the system models the complete document lifecycle:

```text
                 ┌──────────────┐
                 │    Client    │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │   Document   │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │    Upload    │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │    Review    │
                 └──────┬───────┘
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
        ┌───────────┐      ┌──────────────┐
        │ Approved  │      │  Correction  │
        └───────────┘      │   Required   │
                           └───────┬──────┘
                                   │
                                   ▼
                              Re-upload
                                   │
                                   ▼
                                Review
                                   │
                                   ▼
                              Approved

                    Every action
                         │
                         ▼
                 ┌──────────────┐
                 │ Audit History│
                 └──────────────┘
```

The result is a compact but complete demonstration of:

**workflow design + role-based authorization + tenant isolation + document versioning + auditability + full-stack development.**
