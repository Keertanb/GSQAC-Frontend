import { BrowserRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import Router from "./routes/Router";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary
      logLabel="App"
      title="The application hit an unexpected error"
      message="Reload the page to continue."
    >
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
    </ErrorBoundary>
  );
}

export default App;
