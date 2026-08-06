import { useMemo, useState } from "react";
import { enqueueSnackbar } from "notistack";
import {
  uploadNewsImage,
  useAdminNewsQuery,
  useDeleteNewsMutation,
  useUpsertNewsMutation,
} from "../../../../services/landingContentService";

const EMPTY_FORM = {
  newsId: null,
  title: "",
  description: "",
  imageFileName: "",
  imageUrl: "",
  linkUrl: "",
  sortOrder: 0,
  isActive: true,
};

export function useLatestNewsAdmin() {
  const { data, isLoading, isError, refetch } = useAdminNewsQuery();
  const upsertMutation = useUpsertNewsMutation({
    onSuccess: () => {
      setModalOpen(false);
      setForm(EMPTY_FORM);
      setPendingFile(null);
    },
  });
  const deleteMutation = useDeleteNewsMutation();

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
      newsId: row.newsId,
      title: row.title || "",
      description: row.description || "",
      imageFileName: row.imageFileName || "",
      imageUrl: row.imageUrl || "",
      linkUrl: row.linkUrl || "",
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

    try {
      setUploading(true);
      let imageFileName = form.imageFileName || null;
      if (pendingFile) {
        imageFileName = await uploadNewsImage(pendingFile);
      }

      await upsertMutation.mutateAsync({
        newsId: form.newsId || null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        imageFileName,
        linkUrl: form.linkUrl.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: !!form.isActive,
      });
    } catch (error) {
      enqueueSnackbar(error.message || "Failed to save news", {
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.newsId) return;
    await deleteMutation.mutateAsync(deleteTarget.newsId);
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
    uploading,
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
