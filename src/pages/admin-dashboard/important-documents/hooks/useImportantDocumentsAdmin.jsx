import { useMemo, useState } from "react";
import { enqueueSnackbar } from "notistack";
import {
  uploadImportantDocument,
  useAdminDocumentsQuery,
  useDeleteDocumentMutation,
  useUpsertDocumentMutation,
} from "../../../../services/landingContentService";

const EMPTY_FORM = {
  documentId: null,
  title: "",
  description: "",
  fileName: "",
  originalFileName: "",
  fileUrl: "",
  sortOrder: 0,
  isActive: true,
};

export function useImportantDocumentsAdmin() {
  const { data, isLoading, isError, refetch } = useAdminDocumentsQuery();
  const upsertMutation = useUpsertDocumentMutation({
    onSuccess: () => {
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setPendingFile(null);
    },
  });
  const deleteMutation = useDeleteDocumentMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const rows = useMemo(() => {
    const payload = data?.data || data || [];
    return Array.isArray(payload) ? payload : [];
  }, [data]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setPendingFile(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setForm({
      documentId: row.documentId,
      title: row.title || "",
      description: row.description || "",
      fileName: row.fileName || "",
      originalFileName: row.originalFileName || "",
      fileUrl: row.fileUrl || "",
      sortOrder: Number(row.sortOrder) || 0,
      isActive: row.isActive === true || row.isActive === 1,
    });
    setPendingFile(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (upsertMutation.isPending || uploading) return;
    setModalOpen(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      enqueueSnackbar("Title is required", { variant: "warning" });
      return;
    }
    if (!pendingFile && !form.fileName) {
      enqueueSnackbar("Please upload a document file", { variant: "warning" });
      return;
    }

    try {
      setUploading(true);
      let fileName = form.fileName;
      let originalFileName = form.originalFileName || null;
      if (pendingFile) {
        fileName = await uploadImportantDocument(pendingFile);
        originalFileName = pendingFile.name;
      }

      await upsertMutation.mutateAsync({
        documentId: form.documentId || null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        fileName,
        originalFileName,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: !!form.isActive,
      });
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to save document", {
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.documentId) return;
    await deleteMutation.mutateAsync(deleteTarget.documentId);
    setDeleteTarget(null);
  };

  return {
    rows,
    isLoading,
    isError,
    refetch,
    modalOpen,
    form,
    setForm,
    pendingFile,
    setPendingFile,
    saving: upsertMutation.isPending || uploading,
    openCreate,
    openEdit,
    closeModal,
    handleSave,
    deleteTarget,
    setDeleteTarget,
    confirmDelete,
    deleting: deleteMutation.isPending,
  };
}
