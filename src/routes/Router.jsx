import { useRoutes } from "react-router-dom";
import { useMemo } from "react";
import useAuthStore from "../store/useAuthStore";
import {
  publicRoutes,
  schoolRoutes,
  parentRoutes,
  inspectorRoutes,
  adminRoutes,
} from "./Routes";

const Router = () => {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);

  const routes = useMemo(() => {
    if (!token) {
      return publicRoutes;
    }

    const roleBasedRoutes = {
      school: schoolRoutes,
      parent: parentRoutes,
      inspector: inspectorRoutes,
      admin: adminRoutes,
    };

    const selectedRoleRoutes = roleBasedRoutes[role] || [];

    return [...publicRoutes, ...selectedRoleRoutes];
  }, [token, role]);

  const routing = useRoutes(routes);

  return routing;
};

export default Router;
