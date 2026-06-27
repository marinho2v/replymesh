import { useEffect, useState } from "react";
import { api } from "../../services/api.js";

export function FounderProgram({ onToast }) {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => api.getFounderProgram()
    .then(setData)
    .catch((error) => onToast?.(error.message, "error"));

  useEffect(load, []);

  if (!data) return <div className="route-loader">Carregando Programa Fundadores...</div>;
  const program = data.founder_program;

  const update = (key, value) => setData((current) => ({
    ...current,
    founder_program: { ...current.founder_program, [key]: value },
  }));

  const save = async () => {
    setSaving(true);
    try {
      const response = await api.updateFounderProgram({
        enabled: program.enabled,
        allow_signups: program.allow_signups,
        signup_limit: Number(program.signup_limit),
        started_at: program.started_at || null,
        ends_at: program.ends_at || null,
        default_modules: program.default_modules,
      });
      setData(response);
      onToast?.("Programa Fundadores atualizado.", "success");
    } catch (error) {
      onToast?.(error.message, "error");
    } finally { setSaving(false); }
  };

  const toggleModule = (key) => {
    const selected = new Set(program.default_modules || []);
    selected.has(key) ? selected.delete(key) : selected.add(key);
    update("default_modules", [...selected]);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Programa Fundadores</h1><p>Controle vagas e recursos das empresas cadastradas pelo fluxo público.</p></div>
        <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "Salvando..." : "Salvar configurações"}</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><span>Cadastradas</span><strong>{program.registered}</strong></div>
        <div className="stat-card"><span>Limite</span><strong>{program.signup_limit}</strong></div>
        <div className="stat-card"><span>Vagas restantes</span><strong>{program.remaining}</strong></div>
        <div className="stat-card"><span>Inscrições</span><strong>{program.accepting_signups ? "Abertas" : "Pausadas"}</strong></div>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="form-grid">
          <label><input type="checkbox" checked={program.enabled} onChange={(e) => update("enabled", e.target.checked)} /> Programa ativo</label>
          <label><input type="checkbox" checked={program.allow_signups} onChange={(e) => update("allow_signups", e.target.checked)} /> Permitir novos cadastros</label>
          <label>Limite total<input type="number" min="1" value={program.signup_limit} onChange={(e) => update("signup_limit", e.target.value)} /></label>
          <label>Encerramento opcional<input type="datetime-local" value={program.ends_at?.slice(0, 16) || ""} onChange={(e) => update("ends_at", e.target.value)} /></label>
        </div>
        <h3>Módulos padrão</h3>
        <div className="module-grid">
          {data.module_catalog.map((item) => (
            <label key={item.key} className="module-option">
              <input type="checkbox" checked={(program.default_modules || []).includes(item.key)} disabled={item.core} onChange={() => toggleModule(item.key)} />
              <span><strong>{item.label}</strong><small>{item.description}</small></span>
            </label>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h3>Empresas fundadoras</h3>
        <div className="table-wrap"><table><thead><tr><th>Empresa</th><th>Subdomínio</th><th>Status</th><th>Cadastro</th></tr></thead><tbody>
          {data.companies.map((company) => <tr key={company.id}><td><strong>{company.name}</strong> <span className="badge">Fundador</span> <span className="badge">Gratuito</span></td><td>{company.slug}.replymesh.cloud</td><td>{company.status}</td><td>{company.founder_registered_at ? new Date(company.founder_registered_at).toLocaleString("pt-BR") : "-"}</td></tr>)}
          {!data.companies.length && <tr><td colSpan="4">Nenhuma empresa fundadora cadastrada.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  );
}
