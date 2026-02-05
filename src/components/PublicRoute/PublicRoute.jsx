import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";

const PublicRoute = ({ children }) => {
  const location = useLocation();
  const { user, token, role } = useAuthStore();

  // Check if user is authenticated
  const isAuthenticated = !!(user && token);

  // If authenticated, redirect to appropriate dashboard
  if (isAuthenticated && role) {
    const dashboardRoutes = {
      school: "/school-dashboard",
      parent: "/parent-dashboard",
      inspector: "/inspector-dashboard",
      admin: "/admin-dashboard",
      crc: "/crc-dashboard",
    };

    const dashboardRoute = dashboardRoutes[role];
    if (dashboardRoute) {
      return <Navigate to={dashboardRoute} replace />;
    }
  }

  return children;
};

export default PublicRoute;
