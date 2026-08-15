import { useState } from "react";
import { enqueueSnackbar } from "notistack";
import {
  getParentFeedbackList,
  useGetParentFeedbackListQuery,
} from "../../../../services/feedbackService";
import { exportToExcel } from "../../../../utils/exportToExcel";

const EXCEL_COLUMNS = [
  { id: "createdAt", label: "Submitted" },
  { id: "submitterName", label: "Name" },
  { id: "mobileNumber", label: "Mobile" },
  { id: "email", label: "Email" },
  { id: "schoolName", label: "School name" },
  { id: "schoolId", label: "UDISE / School ID" },
  { id: "sectionName", label: "Section" },
  { id: "domainName", label: "Domain" },
  { id: "subdomainName", label: "Subdomain" },
  { id: "questionText", label: "Question / Criteria" },
  { id: "feedbackText", label: "Grievance" },
  { id: "feedbackSource", label: "Source" },
];

function formatExportDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function useParentFeedback() {
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, isError, refetch } = useGetParentFeedbackListQuery({
    page: currentPage,
    limit: itemsPerPage,
    search,
  });

  const payload = data?.data || data || {};
  const rows = payload.rows || [];
  const total = payload.total || 0;

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(0);
  };

  const handleItemsPerPageChange = (limit) => {
    setItemsPerPage(limit);
    setCurrentPage(0);
  };

  const handleExportToExcel = async () => {
    setExporting(true);
    try {
      const response = await getParentFeedbackList({
        page: 0,
        limit: 50000,
        search,
      });
      const list = response?.data?.rows || response?.rows || [];

      if (!list.length) {
        enqueueSnackbar("No grievances to export", { variant: "warning" });
        return;
      }

      exportToExcel(
        list.map((row) => ({
          ...row,
          createdAt: formatExportDate(row.createdAt),
        })),
        EXCEL_COLUMNS,
        "grievances",
        "Grievances",
      );
      enqueueSnackbar("All grievances downloaded", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to export Excel",
        { variant: "error" },
      );
    } finally {
      setExporting(false);
    }
  };

  return {
    rows,
    total,
    isLoading,
    isError,
    refetch,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    handleItemsPerPageChange,
    search,
    handleSearchChange,
    exporting,
    handleExportToExcel,
  };
}
