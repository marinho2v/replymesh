import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Icon } from "../../components/ui/Icon.jsx";
import { companyImpersonationUrl } from "../../lib/companyImpersonation.js";
import { api } from "../../services/api.js";

export function CompanyImpersonationLaunch() {
  const { id } = useParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const launch = async () => {
      try {
        const data = await api.impersonateCompany(id);
        window.location.replace(companyImpersonationUrl(data));
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
