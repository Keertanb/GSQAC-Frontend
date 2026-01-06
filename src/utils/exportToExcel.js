import * as XLSX from "xlsx";

/**
 * Export data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column definitions with { key, label } or { id, label }
 * @param {string} fileName - Name of the Excel file (without extension)
 * @param {string} sheetName - Name of the Excel sheet (default: "Sheet1")
 */
export const exportToExcel = (data, columns, fileName = "export", sheetName = "Sheet1") => {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Map columns to extract keys and labels
  const columnKeys = columns.map((col) => col.key || col.id);
  const columnLabels = columns.map((col) => col.label || col.key || col.id);

  // Transform data to match column structure
  const worksheetData = data.map((row) => {
    const transformedRow = {};
    columnKeys.forEach((key) => {
      // Handle nested keys (e.g., "user.name")
      const value = key.split(".").reduce((obj, k) => obj?.[k], row);
      transformedRow[key] = value !== undefined && value !== null ? value : "";
    });
    return transformedRow;
  });

  // Create worksheet with headers
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  // Rename headers
  const range = XLSX.utils.decode_range(worksheet["!ref"]);
  columnLabels.forEach((label, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
    if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
    worksheet[cellAddress].v = label;
  });

  // Set column widths
  const maxWidths = columnKeys.map((key, colIndex) => {
    const columnData = worksheetData.map((row) => {
      const value = row[key];
      return value ? String(value).length : 0;
    });
    const headerLength = columnLabels[colIndex]?.length || 0;
    return Math.max(...columnData, headerLength, 10); // Minimum width of 10
  });

  worksheet["!cols"] = maxWidths.map((width) => ({ wch: Math.min(width, 50) }));

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file and trigger download
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Export data to Excel with custom data transformation
 * @param {Array} data - Array of objects to export
 * @param {Function} transformFunction - Function to transform each row: (row) => object
 * @param {Array} headers - Array of header labels
 * @param {string} fileName - Name of the Excel file (without extension)
 * @param {string} sheetName - Name of the Excel sheet (default: "Sheet1")
 */
export const exportToExcelCustom = (
  data,
  transformFunction,
  headers,
  fileName = "export",
  sheetName = "Sheet1"
) => {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Transform data using the provided function
  const transformedData = data.map(transformFunction);

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(transformedData);

  // Update headers if provided
  if (headers && headers.length > 0) {
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    headers.forEach((header, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
      if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
      worksheet[cellAddress].v = header;
    });
  }

  // Set column widths
  const columnCount = headers?.length || Object.keys(transformedData[0] || {}).length;
  worksheet["!cols"] = Array(columnCount)
    .fill(null)
    .map(() => ({ wch: 15 }));

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file and trigger download
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

