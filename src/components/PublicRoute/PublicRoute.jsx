import { useLocation } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/otp-verify";

  if (isAuthPage) {
    return children;
  }

  return children;
};

export default PublicRoute;
