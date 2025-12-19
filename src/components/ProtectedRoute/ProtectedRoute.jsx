import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, token, role, logout } = useAuthStore();
  const location = useLocation();

  const isAuthenticated = !!(user && token);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    logout();
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
