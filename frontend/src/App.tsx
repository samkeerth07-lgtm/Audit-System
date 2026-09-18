import "./App.css";
import { useEffect, useState } from "react";
import Login from "./login";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  firm_id: number;
}

interface Client {
  id: number;
  firm_id: number;
  name: string;
}

interface ReviewQueueItem {
  document_id: number;
  document_name: string;
  client_id: number;
  client_name: string;
  status: string;
  uploader: string | null;
  uploaded_at: string | null;
}

interface Document {
  id: number;
  firm_id: number;
  client_id: number;
  name: string;
  status: string;
}

interface DocumentDetails extends Document {
  client_name?: string;
  latest_correction_comment?: string | null;
  current_version?: number | null;
  uploaded_by?: string | null;
  uploaded_at?: string | null;
}

interface AuditEvent {
  actor: string;
  action: string;
  comment: string | null;
  created_at: string;
  document_id: number;
  document_name: string;
}

const auditActionLabels: Record<string, string> = {
  DOCUMENT_UPLOADED: "Document Uploaded",
  REVIEW_STARTED: "Review Started",
  CORRECTION_REQUESTED: "Correction Requested",
  DOCUMENT_APPROVED: "Document Approved",
};

function formatAuditAction(action: string) {
  return auditActionLabels[action] ?? action;
}

function formatAuditDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("access_token")
  );
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState(false);
  const [clientsRefreshKey, setClientsRefreshKey] = useState(0);
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const [createClientError, setCreateClientError] = useState<string | null>(null);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [reviewQueueLoading, setReviewQueueLoading] = useState(false);
  const [reviewQueueError, setReviewQueueError] = useState(false);
  const [reviewQueueRefreshKey, setReviewQueueRefreshKey] = useState(0);
  const [myDocuments, setMyDocuments] = useState<(Document & { client_name: string })[]>([]);
  const [myDocumentsLoading, setMyDocumentsLoading] = useState(false);
  const [myDocumentsError, setMyDocumentsError] = useState(false);
  const [staffDocumentsRefreshKey, setStaffDocumentsRefreshKey] = useState(0);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState(false);
  const [documentsRefreshKey, setDocumentsRefreshKey] = useState(0);
  const [showAddDocumentForm, setShowAddDocumentForm] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [creatingDocument, setCreatingDocument] = useState(false);
  const [createDocumentError, setCreateDocumentError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentDetails, setDocumentDetails] = useState<DocumentDetails | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [correctionComment, setCorrectionComment] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentRefreshKey, setDocumentRefreshKey] = useState(0);
  const [showAuditHistory, setShowAuditHistory] = useState(false);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditHistoryLoading, setAuditHistoryLoading] = useState(false);
  const [auditHistoryError, setAuditHistoryError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);

  const resetNavigation = () => {
    setSelectedClient(null);
    setSelectedDocument(null);
    setDocumentDetails(null);
    setShowAuditHistory(false);
    setShowAddClientForm(false);
    setShowAddDocumentForm(false);
  };

  const navigateToSection = (sectionId: string) => {
    resetNavigation();
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
    resetNavigation();
  };

  useEffect(() => {
    if (!token) {
      setUser(null);
      setClients([]);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const loadDashboard = async () => {
      setClientsLoading(true);
      setClientsError(false);

      try {
        const [userResponse, clientsResponse] = await Promise.all([
          fetch("http://127.0.0.1:8000/auth/me", { headers }),
          fetch("http://127.0.0.1:8000/clients", { headers }),
        ]);

        if (!userResponse.ok || !clientsResponse.ok) {
          throw new Error("Unable to load dashboard data");
        }

        const [userData, clientsData] = await Promise.all([
          userResponse.json() as Promise<User>,
          clientsResponse.json() as Promise<Client[]>,
        ]);

        setUser(userData);
        setClients(clientsData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setClientsError(true);
      } finally {
        setClientsLoading(false);
      }
    };

    void loadDashboard();
  }, [clientsRefreshKey, token]);

  useEffect(() => {
    if (!token || !user || user.role !== "REVIEWER") {
      setReviewQueue([]);
      return;
    }

    const loadReviewQueue = async () => {
      setReviewQueueLoading(true);
      setReviewQueueError(false);

      try {
        const response = await fetch("http://127.0.0.1:8000/review-queue", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Review queue request failed: ${response.status}`);
        }

        setReviewQueue(await response.json() as ReviewQueueItem[]);
      } catch (error) {
        console.error("Failed to load review queue:", error);
        setReviewQueueError(true);
      } finally {
        setReviewQueueLoading(false);
      }
    };

    void loadReviewQueue();
  }, [reviewQueueRefreshKey, token, user]);

  useEffect(() => {
    if (!token || !user || user.role !== "STAFF" || clients.length === 0) {
      setMyDocuments([]);
      return;
    }

    const loadMyDocuments = async () => {
      setMyDocumentsLoading(true);
      setMyDocumentsError(false);

      try {
        const documentsByClient = await Promise.all(
          clients.map(async (client) => {
            const response = await fetch(
              `http://127.0.0.1:8000/clients/${client.id}/documents`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!response.ok) {
              throw new Error(`My documents request failed: ${response.status}`);
            }

            const clientDocuments = await response.json() as Document[];
            return clientDocuments.map((document) => ({
              ...document,
              client_name: client.name,
            }));
          })
        );

        setMyDocuments(documentsByClient.flat());
      } catch (error) {
        console.error("Failed to load staff documents:", error);
        setMyDocumentsError(true);
      } finally {
        setMyDocumentsLoading(false);
      }
    };

    void loadMyDocuments();
  }, [clients, staffDocumentsRefreshKey, token, user]);

  useEffect(() => {
    if (!token || !selectedClient) {
      setDocuments([]);
      setDocumentsError(false);
      return;
    }

    const loadDocuments = async () => {
      setDocumentsLoading(true);
      setDocumentsError(false);

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/clients/${selectedClient.id}/documents`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Document request failed: ${response.status}`);
        }

        setDocuments(await response.json() as Document[]);
      } catch (error) {
        console.error("Failed to load documents:", error);
        setDocumentsError(true);
      } finally {
        setDocumentsLoading(false);
      }
    };

    void loadDocuments();
  }, [documentsRefreshKey, selectedClient, token]);

  useEffect(() => {
    if (!token || !selectedDocument) {
      setDocumentDetails(null);
      setDocumentError(null);
      return;
    }

    const loadDocumentDetails = async () => {
      setDocumentLoading(true);
      setDocumentError(null);

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/documents/${selectedDocument.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail ?? "Unable to load document.");
        }

        setDocumentDetails(await response.json() as DocumentDetails);
      } catch (error) {
        console.error("Failed to load document details:", error);
        setDocumentError(
          error instanceof Error ? error.message : "Unable to load document."
        );
      } finally {
        setDocumentLoading(false);
      }
    };

    void loadDocumentDetails();
  }, [documentRefreshKey, selectedDocument, token]);

  useEffect(() => {
    if (!token || !selectedDocument || !showAuditHistory) return;

    const loadAuditHistory = async () => {
      setAuditHistoryLoading(true);
      setAuditHistoryError(false);

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/documents/${selectedDocument.id}/audit-history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Audit history request failed: ${response.status}`);
        }

        setAuditEvents(await response.json() as AuditEvent[]);
      } catch (error) {
        console.error("Failed to load audit history:", error);
        setAuditHistoryError(true);
      } finally {
        setAuditHistoryLoading(false);
      }
    };

    void loadAuditHistory();
  }, [selectedDocument, showAuditHistory, token]);

  const runReviewAction = async (
    path: string,
    body?: Record<string, string>
  ) => {
    if (!token || !selectedDocument) return;

    setActionError(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/documents/${selectedDocument.id}/${path}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail ?? "The action could not be completed.");
      }

      setCorrectionComment("");
      setDocumentRefreshKey((key) => key + 1);
      setReviewQueueRefreshKey((key) => key + 1);
    } catch (error) {
      console.error("Document action failed:", error);
      setActionError(
        error instanceof Error
          ? error.message
          : "The action could not be completed."
      );
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file.");
      setUploadSuccess(false);
      return;
    }

    if (!token || !selectedDocument) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `http://127.0.0.1:8000/documents/${selectedDocument.id}/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseData?.detail ?? "Upload failed.");
      }

      setSelectedFile(null);
      setCurrentVersion(
        typeof responseData?.version_number === "number"
          ? responseData.version_number
          : null
      );
      setUploadSuccess(true);
      setDocumentRefreshKey((key) => key + 1);
      setStaffDocumentsRefreshKey((key) => key + 1);
    } catch (error) {
      console.error("Document upload failed:", error);
      setUploadError(
        error instanceof Error ? error.message : "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  const createClient = async () => {
    const trimmedName = clientName.trim();

    if (!trimmedName) {
      setCreateClientError("Client name is required.");
      return;
    }

    if (!token) return;

    setCreatingClient(true);
    setCreateClientError(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/clients", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseData?.detail ?? "Unable to create client.");
      }

      setShowAddClientForm(false);
      setClientName("");
      setCreateClientError(null);
      setClientsRefreshKey((key) => key + 1);
    } catch (error) {
      console.error("Client creation failed:", error);
      setCreateClientError(
        error instanceof Error ? error.message : "Unable to create client."
      );
    } finally {
      setCreatingClient(false);
    }
  };

  const createDocument = async () => {
    const trimmedName = documentName.trim();

    if (!trimmedName) {
      setCreateDocumentError("Document name is required.");
      return;
    }

    if (!token || !selectedClient) return;

    setCreatingDocument(true);
    setCreateDocumentError(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/clients/${selectedClient.id}/documents`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: trimmedName }),
        }
      );

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(responseData?.detail ?? "Unable to create document.");
      }

      setShowAddDocumentForm(false);
      setDocumentName("");
      setCreateDocumentError(null);
      setDocumentsRefreshKey((key) => key + 1);
      setStaffDocumentsRefreshKey((key) => key + 1);
    } catch (error) {
      console.error("Document creation failed:", error);
      setCreateDocumentError(
        error instanceof Error ? error.message : "Unable to create document."
      );
    } finally {
      setCreatingDocument(false);
    }
  };

  if (!token) {
    return <Login onLogin={setToken} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Mini Audit Review System</h1>
          <p>Audit document management</p>
        </div>

        <div className="user-info">
          <span>{user?.name ?? "User"}</span>
          <small>{user?.role ?? "Authenticated"}</small>
          <button type="button" onClick={logout}>Logout</button>
        </div>
      </header>

      <nav className="app-nav" aria-label="Main navigation">
        <button type="button" onClick={() => navigateToSection("dashboard")}>Dashboard</button>
        {user?.role === "REVIEWER" && (
          <button type="button" onClick={() => navigateToSection("review-queue")}>Review Queue</button>
        )}
        <button type="button" onClick={() => navigateToSection("clients")}>Clients</button>
        {user?.role === "STAFF" && (
          <button type="button" onClick={() => navigateToSection("my-documents")}>My Documents</button>
        )}
      </nav>

      <main className="dashboard">
        <section className="welcome" id="dashboard">
          <h2>Welcome, {user?.name ?? "User"}</h2>
          <p>
            {user?.role === "REVIEWER"
              ? "Review submitted documents and track audit activity."
              : "Manage client documents and respond to review corrections."}
          </p>
        </section>

        {user?.role === "REVIEWER" && (
          <section className="clients review-queue-section" id="review-queue">
            <div className="section-header">
              <div>
                <h2>Review Queue</h2>
                <p>Documents requiring reviewer attention.</p>
              </div>
            </div>

            {reviewQueueLoading && (
              <div className="empty-state">Loading review queue...</div>
            )}

            {!reviewQueueLoading && reviewQueueError && (
              <div className="empty-state">Unable to load review queue.</div>
            )}

            {!reviewQueueLoading && !reviewQueueError && reviewQueue.length === 0 && (
              <div className="empty-state">
                <h3>All caught up</h3>
                <p>No documents currently require your review.</p>
              </div>
            )}

            {!reviewQueueLoading && !reviewQueueError && reviewQueue.length > 0 && (
              <div className="review-queue-list">
                {reviewQueue.map((item) => (
                  <article className="review-queue-card" key={item.document_id}>
                    <div>
                      <h3>{item.document_name}</h3>
                      <p>{item.client_name}</p>
                      <p>Uploaded by {item.uploader ?? "Unknown"}</p>
                      {item.uploaded_at && <p>{formatAuditDate(item.uploaded_at)}</p>}
                      <span
                        className={`status-badge status-${item.status
                          .toLowerCase()
                          .replaceAll("_", "-")}`}
                      >
                        Status: {item.status}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClient({
                          id: item.client_id,
                          firm_id: user.firm_id,
                          name: item.client_name,
                        });
                        setSelectedDocument({
                          id: item.document_id,
                          firm_id: user.firm_id,
                          client_id: item.client_id,
                          name: item.document_name,
                          status: item.status,
                        });
                        setShowAuditHistory(false);
                        setDocumentError(null);
                        setActionError(null);
                      }}
                    >
                      Open Document
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {user?.role === "STAFF" && (
          <section className="clients staff-documents-section" id="my-documents">
            <div className="section-header">
              <div>
                <h2>My Documents</h2>
                <p>Documents for your clients.</p>
              </div>
            </div>

            {myDocumentsLoading && (
              <div className="empty-state">Loading documents...</div>
            )}

            {!myDocumentsLoading && myDocumentsError && (
              <div className="empty-state">Unable to load documents.</div>
            )}

            {!myDocumentsLoading && !myDocumentsError && myDocuments.length === 0 && (
              <div className="empty-state">No documents found</div>
            )}

            {!myDocumentsLoading && !myDocumentsError && myDocuments.length > 0 && (
              <div className="document-list">
                {myDocuments.map((document) => (
                  <article className="document-card" key={document.id}>
                    <div>
                      <h3>{document.name}</h3>
                      <p>{document.client_name}</p>
                      <p>Status: {document.status}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const client = clients.find(
                          (item) => item.id === document.client_id
                        );
                        if (!client) return;
                        setSelectedClient(client);
                        setSelectedDocument(document);
                        setShowAuditHistory(false);
                      }}
                    >
                      Open Document
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="clients" id="clients">
          {!selectedClient ? (
            <>
              <div className="section-header">
                <div>
                  <h2>Clients</h2>
                  <p>Select a client to view audit documents.</p>
                </div>

                {user?.role === "STAFF" && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddClientForm(true);
                      setCreateClientError(null);
                    }}
                  >
                    Add Client
                  </button>
                )}
              </div>

              {showAddClientForm && (
                <form
                  className="client-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void createClient();
                  }}
                >
                  <h3>Add New Client</h3>
                  <label htmlFor="client-name">Client Name</label>
                  <input
                    id="client-name"
                    type="text"
                    placeholder="Enter client name"
                    value={clientName}
                    onChange={(event) => {
                      setClientName(event.target.value);
                      setCreateClientError(null);
                    }}
                  />
                  {createClientError && (
                    <p className="action-error">{createClientError}</p>
                  )}
                  <div className="client-form-actions">
                    <button
                      type="button"
                      disabled={creatingClient}
                      onClick={() => {
                        setShowAddClientForm(false);
                        setClientName("");
                        setCreateClientError(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={creatingClient}>
                      {creatingClient ? "Creating..." : "Create Client"}
                    </button>
                  </div>
                </form>
              )}

              {clientsLoading && <div className="empty-state">Loading clients...</div>}

              {!clientsLoading && clientsError && (
                <div className="empty-state">Unable to load clients.</div>
              )}

              {!clientsLoading && !clientsError && clients.length === 0 && (
                <div className="empty-state">
                  <h3>No clients found</h3>
                  <p>No clients are currently available for your firm.</p>
                </div>
              )}

              {!clientsLoading && !clientsError && clients.length > 0 && (
                <div className="client-grid">
                  {clients.map((client) => (
                    <article className="client-card" key={client.id}>
                      <div>
                        <h3>{client.name}</h3>
                        <p>Client ID: {client.id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClient(client);
                          setSelectedDocument(null);
                        }}
                      >
                        View Documents
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : !selectedDocument ? (
            <>
              <div className="section-header">
                <div>
                  <h2>{selectedClient.name}</h2>
                  <p>Documents</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setSelectedDocument(null);
                  }}
                >
                  ← Back to Clients
                </button>
                {user?.role === "STAFF" && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDocumentForm(true);
                      setCreateDocumentError(null);
                    }}
                  >
                    + Add Document
                  </button>
                )}
              </div>

              {showAddDocumentForm && (
                <form
                  className="client-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void createDocument();
                  }}
                >
                  <h3>Add Audit Document</h3>
                  <label htmlFor="document-name">Document Name</label>
                  <input
                    id="document-name"
                    type="text"
                    placeholder="Enter document name"
                    value={documentName}
                    onChange={(event) => {
                      setDocumentName(event.target.value);
                      setCreateDocumentError(null);
                    }}
                  />
                  {createDocumentError && (
                    <p className="action-error">{createDocumentError}</p>
                  )}
                  <div className="client-form-actions">
                    <button
                      type="button"
                      disabled={creatingDocument}
                      onClick={() => {
                        setShowAddDocumentForm(false);
                        setDocumentName("");
                        setCreateDocumentError(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={creatingDocument}>
                      {creatingDocument ? "Creating..." : "Create Document"}
                    </button>
                  </div>
                </form>
              )}

              {documentsLoading && <div className="empty-state">Loading documents...</div>}

              {!documentsLoading && documentsError && (
                <div className="empty-state">Unable to load documents.</div>
              )}

              {!documentsLoading && !documentsError && documents.length === 0 && (
                <div className="empty-state">No documents found</div>
              )}

              {!documentsLoading && !documentsError && documents.length > 0 && (
                <div className="document-list">
                  {documents.map((document) => (
                    <article className="document-card" key={document.id}>
                      <div>
                        <h3>{document.name}</h3>
                        <p>Status: {document.status}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDocument(document);
                          setShowAuditHistory(false);
                          setDocumentError(null);
                          setActionError(null);
                          setUploadError(null);
                          setUploadSuccess(false);
                          setCurrentVersion(null);
                        }}
                      >
                        Open
                      </button>
                    </article>
                  ))}
                </div>
              )}

            </>
          ) : showAuditHistory ? (
            <>
              <div className="section-header">
                <div>
                  <h2>Audit History</h2>
                  <p>Document: {documentDetails?.name ?? selectedDocument.name}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAuditHistory(false)}
                >
                  ← Back to Document
                </button>
              </div>

              {auditHistoryLoading && (
                <div className="empty-state">Loading audit history...</div>
              )}

              {!auditHistoryLoading && auditHistoryError && (
                <div className="empty-state">Unable to load audit history.</div>
              )}

              {!auditHistoryLoading && !auditHistoryError && auditEvents.length === 0 && (
                <div className="empty-state">No audit activity yet.</div>
              )}

              {!auditHistoryLoading && !auditHistoryError && auditEvents.length > 0 && (
                <div className="audit-timeline">
                  {auditEvents.map((event, index) => (
                    <article className="audit-event" key={`${event.created_at}-${index}`}>
                      <span className="audit-marker" aria-hidden="true" />
                      <div className="audit-event-content">
                        <strong>{event.actor}</strong>
                        <h3>{formatAuditAction(event.action)}</h3>
                        {event.comment?.trim() && (
                          <p className="audit-comment">{event.comment}</p>
                        )}
                        <time dateTime={event.created_at}>
                          {formatAuditDate(event.created_at)}
                        </time>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="section-header">
                <div>
                  <h2>Document Detail</h2>
                  <p>{selectedClient.name}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDocument(null);
                    setDocumentDetails(null);
                    setSelectedFile(null);
                    setActionError(null);
                    setShowAuditHistory(false);
                          setUploadError(null);
                          setUploadSuccess(false);
                          setCurrentVersion(null);
                  }}
                >
                  ← Back to Documents
                </button>
              </div>

              {documentLoading && (
                <div className="empty-state">Loading document...</div>
              )}

              {!documentLoading && documentError && (
                <div className="empty-state">{documentError}</div>
              )}

              {!documentLoading && !documentError && documentDetails && (
                <div className="document-detail">
                  <div className="detail-heading">
                    <div>
                      <h2>{documentDetails.name}</h2>
                      <p>Client: {documentDetails.client_name ?? selectedClient.name}</p>
                      {documentDetails.current_version !== null &&
                        documentDetails.current_version !== undefined && (
                          <p>Current Version: {documentDetails.current_version}</p>
                        )}
                      {documentDetails.uploaded_by && (
                        <p>Uploaded By: {documentDetails.uploaded_by}</p>
                      )}
                      {documentDetails.uploaded_at && (
                        <p>Upload Time: {formatAuditDate(documentDetails.uploaded_at)}</p>
                      )}
                    </div>
                    <span
                      className={`status-badge status-${documentDetails.status
                        .toLowerCase()
                        .replaceAll("_", "-")}`}
                    >
                      {documentDetails.status}
                    </span>
                  </div>

                  {actionError && <p className="action-error">{actionError}</p>}

                  {uploadError && <p className="action-error">{uploadError}</p>}
                  {uploadSuccess && (
                    <p className="success-message">Document uploaded successfully.</p>
                  )}
                  {currentVersion !== null && (
                    <p className="selected-document">Current Version: {currentVersion}</p>
                  )}

                  {user?.role === "REVIEWER" && documentDetails.status === "UPLOADED" && (
                    <div className="action-row">
                      <button
                        type="button"
                        onClick={() => void runReviewAction("review/start")}
                      >
                        Start Review
                      </button>
                    </div>
                  )}

                  {user?.role === "REVIEWER" && documentDetails.status === "UNDER_REVIEW" && (
                    <div className="review-actions">
                      <div className="action-row">
                        <button
                          type="button"
                          onClick={() => void runReviewAction("approve")}
                        >
                          Approve
                        </button>
                      </div>

                      <div className="correction-form">
                        <label htmlFor="correction-comment">Correction Comment</label>
                        <textarea
                          id="correction-comment"
                          value={correctionComment}
                          onChange={(event) => setCorrectionComment(event.target.value)}
                          placeholder="Enter the correction reason"
                          rows={4}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!correctionComment.trim()) {
                              setActionError("Correction comment is required.");
                              return;
                            }

                            void runReviewAction("request-correction", {
                              comment: correctionComment.trim(),
                            });
                          }}
                        >
                          Request Correction
                        </button>
                      </div>
                    </div>
                  )}

                  {user?.role === "REVIEWER" && documentDetails.status === "APPROVED" && (
                    <p className="success-message">Document approved</p>
                  )}

                  {user?.role === "REVIEWER" && documentDetails.status === "CORRECTION_REQUIRED" && (
                    <p className="selected-document">Waiting for staff correction</p>
                  )}

                  {user?.role === "STAFF" &&
                    ["PENDING", "CORRECTION_REQUIRED"].includes(documentDetails.status) && (
                      <div className="upload-section">
                        {documentDetails.status === "CORRECTION_REQUIRED" && (
                          <>
                            <h3>Correction required</h3>
                            {documentDetails.latest_correction_comment && (
                              <p>{documentDetails.latest_correction_comment}</p>
                            )}
                          </>
                        )}

                        <label htmlFor="document-file">Choose File</label>
                        <input
                          id="document-file"
                          type="file"
                          key={selectedFile?.name ?? "empty"}
                          onChange={(event) =>
                            {
                              setSelectedFile(event.target.files?.[0] ?? null);
                              setUploadError(null);
                              setUploadSuccess(false);
                            }
                          }
                        />
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={() => void uploadDocument()}
                        >
                          {uploading ? "Uploading..." : "Upload Document"}
                        </button>
                        {selectedFile && <p>Selected file: {selectedFile.name}</p>}
                      </div>
                    )}

                  {user?.role === "REVIEWER" && (
                    <button
                      type="button"
                      className="audit-history-button"
                      onClick={() => setShowAuditHistory(true)}
                    >
                      View Audit History
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;