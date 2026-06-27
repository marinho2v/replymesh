import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useRoutes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import { Toast } from "./components/shared/Toast.jsx";
import { productionDomainRedirect } from "./lib/productionDomains.js";
import { routes } from "./router/routes.jsx";
import { api, clearSession, getAuthToken, getStoredUser } from "./services/api.js";

let toastTimer = null;

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => (getStoredUser() ? getAuthToken() : null));
  const domainRedirect = productionDomainRedirect({
    hostname: window.location.hostname,
    pathname: location.pathname,
    hasSession: Boolean(token && user),
  });

  useEffect(() => {
    if (domainRedirect) window.location.replace(domainRedirect);
  }, [domainRedirect]);

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
    const updateUser = (event) => {
      const nextUser = event.detail || getStoredUser();
      setUser(nextUser);
      setToken(nextUser ? getAuthToken() : null);
    };
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

  if (domainRedirect) return null;

  const PUBLIC_PATHS = [
    "/",
    "/login",
    "/home",
    "/fundadores",
    "/cadastro",
    "/comece-gratis",
    "/entrar",
    "/acessar",
    "/termos-de-uso",
    "/politica-de-privacidade",
    "/recursos",
    "/funcionalidades",
    "/integracoes",
    "/aplicativo",
    "/sobre-nos",
    "/clientes",
    "/blog",
    "/contato",
    "/central-de-ajuda",
    "/tutoriais",
    "/status",
    "/fale-conosco",
  ];
  if (PUBLIC_PATHS.includes(location.pathname)) {
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
