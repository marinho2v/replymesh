import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useRoutes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import { Toast } from "./components/shared/Toast.jsx";
import { routes } from "./router/routes.jsx";
import { api, clearSession, getAuthToken, getStoredUser } from "./services/api.js";

let toastTimer = null;

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [token, setToken] = useState(() => getAuthToken());
  const [user, setUser] = useState(() => getStoredUser());

  const showToast = useCallback((msg, kind = "info") => {
    setToast({ msg, kind });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      clearSession();
      setToken(null);
      setUser(null);
      showToast("Sessao expirada. Faca login novamente.", "err");
      navigate("/login", { replace: true });
    };

    window.addEventListener("replymesh:unauthorized", onUnauthorized);
    return () => window.removeEventListener("replymesh:unauthorized", onUnauthorized);
  }, [navigate, showToast]);

  useEffect(() => {
    const updateUser = (event) => setUser(event.detail || getStoredUser());
    window.addEventListener("replymesh:user-updated", updateUser);
    return () => window.removeEventListener("replymesh:user-updated", updateUser);
  }, []);

  const handleLogin = () => {
    setToken(getAuthToken());
    setUser(getStoredUser());
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // A sessao local ainda deve ser encerrada se a API estiver indisponivel.
    }
    clearSession();
    setToken(null);
    setUser(null);
    showToast("Voce saiu da conta", "ok");
    navigate("/login", { replace: true });
  };

  const element = useRoutes(routes(showToast, { onLogin: handleLogin }));

  if (location.pathname === "/login") {
    return (
      <>
        {element}
        <Toast toast={toast} />
      </>
    );
  }

  return (
    <AppLayout toast={toast} onToast={showToast} authToken={token} user={user} onLogout={handleLogout}>
      {element}
    </AppLayout>
  );
}
