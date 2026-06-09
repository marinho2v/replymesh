import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Icon } from "../../components/ui/Icon.jsx";
import { api } from "../../services/api.js";

export function CompanyImpersonationLaunch() {
  const { id } = useParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const launch = async () => {
      try {
        const data = await api.impersonateCompany(id);
        const payload = new URLSearchParams({
          token: data.token,
          session_token: data.session_token,
          company_id: String(data.company_id),
          company_slug: data.company_slug,
          company_name: data.company?.name || "",
          master_name: data.user?.name || "Suporte Replymesh",
          user: JSON.stringify(data.user),
          expires_at: data.expires_at,
        });
        const slug = data.company_slug || "";
        const fallbackUrl = `https://${slug}.replymesh.cloud/loja/${slug}/admin/impersonate`;
        const loginUrl = data.login_url && !data.login_url.includes("127.0.0.1") && !data.login_url.includes("localhost")
          ? data.login_url
          : fallbackUrl;
        window.location.replace(`${loginUrl}#${payload.toString()}`);
      } catch (launchError) {
        if (active) setError(launchError.message || "Nao foi possivel abrir o painel da empresa.");
      }
    };

    launch();
    return () => { active = false; };
  }, [id]);

  return (
    <div className="impersonation-launch">
      <div className="card impersonation-launch-card">
        <div className={`ei ${error ? "error" : ""}`}><Icon name={error ? "ShieldAlert" : "LoaderCircle"} size={28} /></div>
        <h1>{error ? "Acesso nao autorizado" : "Preparando acesso seguro"}</h1>
        <p>{error || "Criando uma sessao temporaria e auditada para o suporte Replymesh."}</p>
        {error && <button className="btn btn-ghost" onClick={() => window.close()}>Fechar esta aba</button>}
      </div>
    </div>
  );
}
