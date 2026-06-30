import { useState } from "react";
import { useGetParentFeedbackListQuery } from "../../../../services/feedbackService";

export function useParentFeedback() {
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [search, setSearch] = useState("");

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
  };
}
