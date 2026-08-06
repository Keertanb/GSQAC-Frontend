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

export function LatestNewsAdminView({ c }) {
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
    <div className="ln-admin">
      <div className="ln-admin__header">
        <div>
          <h1>Latest News</h1>
          <p>Manage landing-page news carousel items (image, title, description, link).</p>
        </div>
        <AppButton variant="blue" size="sm" onClick={openCreate}>
          Add News
        </AppButton>
      </div>

      {isError ? (
        <div className="ln-admin__state">
          <p>Failed to load news.</p>
          <AppButton variant="blue" size="sm" onClick={() => refetch()}>
            Retry
          </AppButton>
        </div>
      ) : isLoading ? (
        <div className="ln-admin__state">Loading news…</div>
      ) : rows.length === 0 ? (
        <div className="ln-admin__state">No news items yet. Add the first one.</div>
      ) : (
        <div className="ln-admin__grid">
          {rows.map((row) => (
            <article key={row.newsId} className="ln-admin__card">
              <div
                className="ln-admin__thumb"
                style={
                  row.imageUrl
                    ? { backgroundImage: `url(${row.imageUrl})` }
                    : undefined
                }
              >
                {!row.imageUrl ? <span>No image</span> : null}
                <span
                  className={`ln-admin__badge${
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
              <div className="ln-admin__body">
                <h3>{row.title}</h3>
                <p>{row.description || "No description"}</p>
                {row.linkUrl ? (
                  <a href={row.linkUrl} target="_blank" rel="noreferrer">
                    {row.linkUrl}
                  </a>
                ) : null}
                <div className="ln-admin__meta">Order: {row.sortOrder ?? 0}</div>
                <div className="ln-admin__actions">
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
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onClose={closeModal} fullWidth maxWidth="sm">
        <DialogTitle>{form.newsId ? "Edit News" : "Add News"}</DialogTitle>
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
            label="Link URL (optional)"
            value={form.linkUrl}
            onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))}
            fullWidth
            size="small"
            placeholder="https://..."
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
            <label className="ln-admin__file-label">
              Image (JPG / PNG / WEBP, max 5 MB)
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => setPendingFile(e.target.files?.[0] || null)}
              />
            </label>
            {(pendingFile || form.imageUrl) && (
              <p className="ln-admin__file-hint">
                {pendingFile
                  ? `Selected: ${pendingFile.name}`
                  : "Existing image will be kept"}
              </p>
            )}
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
          <AppButton variant="plain" size="sm" onClick={closeModal} disabled={saving}>
            Cancel
          </AppButton>
          <AppButton variant="blue" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </AppButton>
        </DialogActions>
      </Dialog>

      <ConfirmationModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete news"
        message={`Delete “${deleteTarget?.title || "this item"}”? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="warning"
        isLoading={deleting}
      />
    </div>
  );
}
