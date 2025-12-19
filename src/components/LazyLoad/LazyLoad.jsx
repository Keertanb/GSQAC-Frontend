import { Box, CircularProgress } from "@mui/material";

const LazyLoad = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default LazyLoad;
