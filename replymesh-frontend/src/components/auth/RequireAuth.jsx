import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken, getStoredUser } from "../../services/api.js";

export function RequireAuth({ children }) {
  const location = useLocation();

  if (!getAuthToken() || !getStoredUser()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
