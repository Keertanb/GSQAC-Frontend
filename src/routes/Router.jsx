import { useRoutes } from "react-router-dom";
import { useMemo } from "react";
import useAuthStore from "../store/useAuthStore";
import { getAuthToken } from "../utils/authToken";
import {
  publicRoutes,
  schoolRoutes,
  parentRoutes,
  inspectorRoutes,
  adminRoutes,
  nodalRoutes,
  crcRoutes,
} from "./Routes";

const Router = () => {
  const storeToken = useAuthStore((state) => state.token);
  const token = storeToken || getAuthToken();
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
      nodal: nodalRoutes,
      crc: crcRoutes,
    };

    const selectedRoleRoutes = roleBasedRoutes[role] || [];

    return [...publicRoutes, ...selectedRoleRoutes];
  }, [token, role]);

  const routing = useRoutes(routes);

  return routing;
};

export default Router;
