import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import Router from "./routes/Router";

function App() {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      style={{ zIndex: 200000 }}
    >
      <BrowserRouter>
        <Router />
      </BrowserRouter>
    </SnackbarProvider>
  );
}

export default App;
