import React from "react";
import { useImportantDocumentsAdmin } from "./hooks/useImportantDocumentsAdmin";
import { ImportantDocumentsAdminView } from "./components/ImportantDocumentsAdminView";
import "./ImportantDocumentsAdmin.css";

const ImportantDocumentsAdmin = () => {
  const c = useImportantDocumentsAdmin();
  return <ImportantDocumentsAdminView c={c} />;
};

export default ImportantDocumentsAdmin;
