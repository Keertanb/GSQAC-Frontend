import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material";
import AppButton from "../../../../components/AppButton/AppButton";
import ConfirmationModal from "../../../../components/ConfirmationModal/ConfirmationModal";

export function ImportantDocumentsAdminView({ c }) {
  const {
    rows,
    isLoading,
    isError,
    refetch,
    modalOpen,
    form,
    setForm,
    pendingFile,
    setPendingFile,
    saving,
    openCreate,
    openEdit,
    closeModal,
    handleSave,
    deleteTarget,
    setDeleteTarget,
    confirmDelete,
    deleting,
  } = c;

  return (
    <div className="id-admin">
      <div className="id-admin__header">
        <div>
          <h1>Important Documents</h1>
          <p>
            Upload and manage documents shown on the landing page for view /
            download.
          </p>
        </div>
        <AppButton variant="blue" size="sm" onClick={openCreate}>
          Add Document
        </AppButton>
      </div>

      {isError ? (
        <div className="id-admin__state">
          <p>Failed to load documents.</p>
          <AppButton variant="blue" size="sm" onClick={() => refetch()}>
            Retry
          </AppButton>
        </div>
      ) : isLoading ? (
        <div className="id-admin__state">Loading documents…</div>
      ) : rows.length === 0 ? (
        <div className="id-admin__state">
          No documents yet. Upload the first one.
        </div>
      ) : (
        <div className="id-admin__list">
          {rows.map((row) => (
            <article key={row.documentId} className="id-admin__row">
              <div className="id-admin__icon" aria-hidden>
                PDF
              </div>
              <div className="id-admin__info">
                <h3>{row.title}</h3>
                <p>{row.description || "No description"}</p>
                <div className="id-admin__meta">
                  <span>
                    {row.originalFileName || row.fileName || "File"}
                  </span>
                  <span>Order: {row.sortOrder ?? 0}</span>
                  <span
                    className={`id-admin__badge${
                      row.isActive === true || row.isActive === 1
                        ? " is-on"
                        : ""
                    }`}
                  >
                    {row.isActive === true || row.isActive === 1
                      ? "Active"
                      : "Hidden"}
                  </span>
                </div>
              </div>
              <div className="id-admin__actions">
                {row.fileUrl ? (
                  <a
                    href={row.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="id-admin__link"
                  >
                    View
                  </a>
                ) : null}
                <AppButton
                  variant="plain"
                  size="sm"
                  onClick={() => openEdit(row)}
                >
                  Edit
                </AppButton>
                <AppButton
                  variant="plain"
                  size="sm"
                  onClick={() => setDeleteTarget(row)}
                >
                  Delete
                </AppButton>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onClose={closeModal} fullWidth maxWidth="sm">
        <DialogTitle>
          {form.documentId ? "Edit Document" : "Add Document"}
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            fullWidth
            size="small"
            required
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            fullWidth
            size="small"
            multiline
            minRows={3}
          />
          <TextField
            label="Sort order"
            type="number"
            value={form.sortOrder}
            onChange={(e) =>
              setForm((p) => ({ ...p, sortOrder: e.target.value }))
            }
            fullWidth
            size="small"
          />
          <div>
            <label className="id-admin__file-label">
              File (PDF / DOC / DOCX / JPG / PNG, max 10 MB)
              <input
                type="file"
                accept=".pdf,.doc,.docx,image/png,image/jpeg,application/pdf"
                onChange={(e) => setPendingFile(e.target.files?.[0] || null)}
              />
            </label>
            <p className="id-admin__file-hint">
              {pendingFile
                ? `Selected: ${pendingFile.name}`
                : form.originalFileName || form.fileName
                  ? `Current: ${form.originalFileName || form.fileName}`
                  : "A file is required for new documents"}
            </p>
          </div>
          <FormControlLabel
            control={
              <Switch
                checked={!!form.isActive}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isActive: e.target.checked }))
                }
              />
            }
            label="Show on landing page"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton
            variant="plain"
            size="sm"
            onClick={closeModal}
            disabled={saving}
          >
            Cancel
          </AppButton>
          <AppButton
            variant="blue"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </AppButton>
        </DialogActions>
      </Dialog>

      <ConfirmationModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete document"
        message={`Delete “${deleteTarget?.title || "this document"}”? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="warning"
        isLoading={deleting}
      />
    </div>
  );
}
