const LANDING_HOSTS = new Set(["replymesh.cloud", "www.replymesh.cloud"]);
const MASTER_HOST = "app.replymesh.cloud";

const LANDING_PATHS = new Set([
  "/",
  "/home",
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
]);

export function productionDomainRedirect({ hostname, pathname, hasSession }) {
  const host = String(hostname || "").toLowerCase();
  const path = pathname || "/";

  if (host === MASTER_HOST && LANDING_PATHS.has(path)) {
    if (path === "/" || path === "/home") {
      return hasSession
        ? `https://${MASTER_HOST}/dashboard`
        : `https://${MASTER_HOST}/login`;
    }

    return `https://replymesh.cloud${path}`;
  }

  if (LANDING_HOSTS.has(host) && !LANDING_PATHS.has(path)) {
    const masterPath = path === "/login" ? "/login" : path;
    return `https://${MASTER_HOST}${masterPath}`;
  }

  return null;
}
