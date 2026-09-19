# Mini Audit Document Review System

A role-based audit document workflow system designed for small and mid-sized CA firms.

The system provides a structured workflow for collecting client documents, uploading and reviewing them, requesting corrections, approving documents, maintaining document versions, and recording an immutable audit history.

It replaces a fragmented workflow of spreadsheets, email, messaging applications, and shared folders with a centralized document review process.

---

## 🌐 Live Demo

**Frontend:**  
https://audit-system-blush-five.vercel.app

**Backend API:**  
https://audit-system-eibg.onrender.com

**API Documentation:**  
https://audit-system-eibg.onrender.com/docs

> The frontend is deployed on Vercel and communicates with the FastAPI backend deployed on Render.

---

## 📌 Problem

Audit work in small and mid-sized CA firms can involve several disconnected tools:

- WhatsApp
- Excel
- Email
- Google Drive
- Manual follow-ups

This can make it difficult to answer basic questions such as:

- Which documents has the client submitted?
- Who uploaded a document?
- Has the reviewer checked it?
- Why was a document sent back?
- Which version is the latest?
- Who approved the document?
- What exactly happened to the document over time?

The Mini Audit Document Review System addresses these workflow problems through a centralized, role-based process.

---

## 🎯 Objective

The goal of the system is to provide a small but complete audit-document workflow covering:

1. Client management
2. Document collection
3. Document upload
4. Document review
5. Correction requests
6. Document approval
7. Document versioning
8. Audit history
9. Role-based access
10. Firm-level data isolation

The system intentionally focuses on the core workflow instead of adding unrelated accounting or automation features.

---

# ✨ Key Features

### 👥 Client Management

Users can:

- View clients belonging to their firm
- Create clients
- Open a client's document workspace
- View documents associated with the client

---

### 📄 Document Management

Documents can move through a controlled review workflow.

Each document stores information such as:

- Document name
- Client
- Firm
- Current status
- Uploaded version
- Uploader
- Upload timestamp

---

### 🔄 Document Review Workflow

The document lifecycle is:

```text
PENDING
   ↓
UPLOADED
   ↓
UNDER_REVIEW
   ↓
APPROVED
