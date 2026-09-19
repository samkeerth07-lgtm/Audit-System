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

Ravi
