import { Fragment } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { Search } from "@mui/icons-material";
import AppTableWrapper from "./AppTable.style";

const ROWS_PER_PAGE = [5, 10, 25, 50, 100];

/**
 * AppTable Component - Reusable table component with search, pagination, and customizable columns
 * 
 * @param {Object} props
 * @param {Array} props.columns - Array of column definitions
 * @param {Array} props.data - Array of data objects
 * @param {string|number} props.rowKey - Key to use as unique identifier for rows
 * @param {boolean} props.loading - Show loading state
 * @param {boolean} props.hideToolbar - Hide the toolbar (search, pagination controls)
 * @param {boolean} props.hidePagination - Hide pagination
 * @param {JSX.Element} props.toolbarContent - Custom content to show in toolbar
 * @param {JSX.Element} props.headerContent - Custom content to show in header
 * @param {string} props.search - Search input value
 * @param {Function} props.handleSearchChange - Handler for search input change
 * @param {number} props.rowsPerPage - Number of rows per page
 * @param {number} props.page - Current page number
 * @param {number} props.count - Total number of items
 * @param {Function} props.handleChangePage - Handler for page change
 * @param {Function} props.handleRowsPerPageChange - Handler for rows per page change
 * @param {boolean} props.showZeroIfEmpty - Show 0 instead of '-' for empty values
 * @param {Array} props.footerColumns - Footer column definitions
 * @param {Object} props.footerData - Footer data object
 * @param {boolean} props.hideBorders - Hide table borders
 * @param {Object} props.boxProps - Additional props for wrapper Box
 * @param {Object} props.tableProps - Additional props for Table component
 */
const AppTable = (props) => {
  const {
    data = [],
    rowsPerPage = 10,
    handleChangePage,
    handleRowsPerPageChange,
    columns = [],
    rowKey = "id",
    loading = false,
    hideToolbar = false,
    hidePagination = false,
    toolbarContent,
    headerContent,
    search = "",
    handleSearchChange,
    page = 0,
    count = 0,
    showZeroIfEmpty = false,
    footerColumns = [],
    footerData = {},
    hideBorders = false,
    boxProps = {},
    tableProps = {},
  } = props;

  const { t } = useTranslation();

  // Helper function to get nested value from object
  const getValue = (obj, path) => {
    return path.split(".").reduce((current, prop) => current?.[prop], obj);
  };

  // Calculate total columns for empty state
  const getTotalColumns = () => {
    return columns.reduce((total, column) => {
      return total + (column?.subLabel?.length || 1);
    }, 0);
  };

  return (
    <AppTableWrapper
      mt={3}
      position="relative"
      $hideBorders={hideBorders}
      {...boxProps}
    >
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            zIndex: 10,
          }}
        >
          <Typography>Loading...</Typography>
        </Box>
      )}

      {!hideToolbar && (
        <>
          <Toolbar className={`table-toolbar ${!search ? "end" : ""}`}>
            <Box display="flex" alignItems="center" flex={1}>
              {search !== undefined && (
                <Box flex={1} minWidth={250} maxWidth={300}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={t("common.search") || "Search"}
                    value={search}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ cursor: "default" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              )}

              {toolbarContent && (
                <Box
                  display="flex"
                  gap={2}
                  flexWrap="wrap"
                  flex={2}
                  minWidth={250}
                  ml="auto"
                >
                  {toolbarContent}
                </Box>
              )}
            </Box>

            {!hidePagination && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                  className="pagination-selector"
                >
                  {ROWS_PER_PAGE.map((pageSize) => (
                    <MenuItem key={pageSize} value={pageSize}>
                      {pageSize} {t("common.entries") || "entries"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Toolbar>

          {headerContent && (
            <Box className="header-content">{headerContent}</Box>
          )}
        </>
      )}

      <TableContainer className="table-container">
        <Table {...tableProps}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  className="table-header"
                  align={column.align || "left"}
                  colSpan={column?.subLabel?.length || undefined}
                  rowSpan={column?.subLabel?.length ? undefined : 2}
                  {...column.columnProps}
                >
                  <Typography
                    noWrap
                    fontWeight={700}
                    variant="subtitle2"
                    {...column.labelProps}
                  >
                    {column.label}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
            {columns.some((col) => col?.subLabel?.length) && (
              <TableRow>
                {columns.map((column) => (
                  <Fragment key={column.id}>
                    {column?.subLabel?.map((subColumn) => (
                      <TableCell
                        key={subColumn.id}
                        className="table-header"
                        align={subColumn.align || "left"}
                        {...subColumn.columnProps}
                      >
                        <Typography
                          noWrap
                          fontWeight={700}
                          variant="subtitle2"
                          {...subColumn.labelProps}
                        >
                          {subColumn.label}
                        </Typography>
                      </TableCell>
                    ))}
                  </Fragment>
                ))}
              </TableRow>
            )}
          </TableHead>

          <TableBody className="table-body">
            {!data.length && !loading && (
              <TableRow>
                <TableCell
                  align="center"
                  colSpan={getTotalColumns()}
                  sx={{ py: 4 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t("common.noRecordsFound") || "No records found"}
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {data.map((row, index) => (
              <TableRow tabIndex={-1} key={row[rowKey] || index}>
                {columns.map((column) => (
                  <Fragment key={column.id}>
                    {column?.subLabel?.length ? (
                      column.subLabel.map((sub) => (
                        <TableCell
                          key={sub.id}
                          variant="body"
                          className="table-cell"
                          align={sub.align || "left"}
                          {...sub.columnProps}
                        >
                          {sub.element ? (
                            <sub.element {...row} index={index} />
                          ) : (
                            <Typography variant="body2" {...sub.labelProps}>
                              {getValue(row, sub.id)
                                ? getValue(row, sub.id)
                                : showZeroIfEmpty
                                ? 0
                                : "-"}
                            </Typography>
                          )}
                        </TableCell>
                      ))
                    ) : (
                      <TableCell
                        variant="body"
                        className="table-cell"
                        align={column.align || "left"}
                        {...column.columnProps}
                      >
                        {column.element ? (
                          <column.element {...row} index={index} />
                        ) : (
                          <Typography variant="body2" {...column.labelProps}>
                            {getValue(row, column.id)
                              ? getValue(row, column.id)
                              : showZeroIfEmpty
                              ? 0
                              : "-"}
                          </Typography>
                        )}
                      </TableCell>
                    )}
                  </Fragment>
                ))}
              </TableRow>
            ))}
          </TableBody>

          {footerColumns?.length > 0 && (
            <TableFooter className="table-footer">
              <TableRow tabIndex={-1}>
                {footerColumns.map((column) => (
                  <TableCell
                    key={column.id}
                    variant="body"
                    className="table-cell"
                    align={column.align || "left"}
                    {...column.columnProps}
                  >
                    <Typography variant="body2" {...column.labelProps}>
                      {column.label
                        ? column.label
                        : getValue(footerData, column.id)
                        ? getValue(footerData, column.id)
                        : showZeroIfEmpty
                        ? 0
                        : "-"}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>

      {!hidePagination && (
        <TablePagination
          showFirstButton
          showLastButton
          page={page}
          component="div"
          count={count || data.length}
          labelRowsPerPage=""
          rowsPerPageOptions={[]}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          className="table-pagination"
          ActionsComponent={undefined}
          onRowsPerPageChange={undefined}
        />
      )}
    </AppTableWrapper>
  );
};

export default AppTable;

