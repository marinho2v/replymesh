import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/store-access.css";

const normalizeSlug = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/^https?:\/\//, "")
  .replace(/\.replymesh\.cloud.*$/, "")
  .replace(/\/.*$/, "")
  .replace(/[^a-z0-9-]+/g, "-")
  .replace(/^-+|-+$/g, "");

const storeAdminUrl = (slug) => {
  const cleanSlug = normalizeSlug(slug);
  if (!cleanSlug) return "";

  const { hostname, protocol } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5174/loja/" + cleanSlug + "/admin";
  }

  if (hostname.endsWith("replymesh.cloud")) {
    return "https://" + cleanSlug + ".replymesh.cloud/admin";
  }

  return protocol + "//" + hostname + "/loja/" + cleanSlug + "/admin";
};

export function StoreAccess() {
  const [store, setStore] = useState("");
  const slug = useMemo(() => normalizeSlug(store), [store]);
  const url = useMemo(() => storeAdminUrl(slug), [slug]);

  const submit = (event) => {
    event.preventDefault();
    if (!url) return;
    window.location.href = url;
  };

  return (
    <main className="store-access-page">
      <header className="store-access-nav">
        <Link to="/" className="store-access-brand"><img src="/mark.png" alt="" /> Replymesh</Link>
        <Link to="/login" className="store-access-master">Painel Master</Link>
      </header>

      <section className="store-access-shell">
        <div className="store-access-copy">
          <span>ACESSO DA LOJA</span>
          <h1>Entre no painel da sua empresa.</h1>
          <p>Informe o endereço da sua loja para acessar o painel administrativo correto. O login do Master é exclusivo da equipe Replymesh.</p>
          <div className="store-access-note">
            Exemplo: <strong>minhaloja</strong>.replymesh.cloud
          </div>
        </div>

        <form className="store-access-card" onSubmit={submit}>
          <h2>Acessar minha loja</h2>
          <p>Digite apenas o nome do endereço da loja.</p>

          <label>
            Endereço da loja
            <div className="store-access-domain">
              <input
                required
                value={store}
                onChange={(event) => setStore(event.target.value)}
                placeholder="minhaloja"
                autoFocus
              />
              <span>.replymesh.cloud</span>
            </div>
          </label>

          {slug && <div className="store-access-preview">Você será enviado para: <strong>{slug}.replymesh.cloud/admin</strong></div>}

          <button type="submit" disabled={!slug}>Entrar no painel da loja</button>
          <Link to="/comece-gratis" className="store-access-secondary">Ainda não tenho conta</Link>
        </form>
      </section>
    </main>
  );
}
