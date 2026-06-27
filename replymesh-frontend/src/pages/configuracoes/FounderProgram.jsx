import { useEffect, useState } from "react";
import { Icon } from "../../components/ui/Icon.jsx";
import { api } from "../../services/api.js";

export function FounderProgram({ onToast }) {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => api.getFounderProgram()
    .then(setData)
    .catch((error) => onToast?.(error.message, "error"));

  useEffect(() => {
    load();
  }, []);

  if (!data) return <div className="route-loader">Carregando Programa Fundadores...</div>;

  const program = data.founder_program;
  const defaultModules = program.default_modules || [];
  const accepting = Boolean(program.enabled && program.allow_signups && program.remaining > 0);

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
        default_modules: defaultModules,
      });
      setData(response);
      onToast?.("Programa Fundadores atualizado.", "success");
    } catch (error) {
      onToast?.(error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (key) => {
    const selected = new Set(defaultModules);
    selected.has(key) ? selected.delete(key) : selected.add(key);
    update("default_modules", [...selected]);
  };

  return (
    <div className="page founder-admin-page">
      <div className="page-header founder-admin-hero">
        <div>
          <span className="founder-admin-kicker">Crescimento</span>
          <h1>Programa Fundadores</h1>
          <p>Controle o cadastro publico, limite de vagas e modulos liberados para empresas fundadoras.</p>
        </div>
        <button className="btn btn-primary" disabled={saving} onClick={save}>
          <Icon name="Save" size={16} />
          {saving ? "Salvando..." : "Salvar configuracoes"}
        </button>
      </div>

      <section className="founder-admin-status card">
        <div>
          <span className={`status-dot ${accepting ? "online" : "paused"}`} />
          <strong>{accepting ? "Cadastro publico aberto" : "Cadastro publico pausado"}</strong>
          <small>
            Para exibir o formulario em /comece-gratis, mantenha o programa ativo e novos cadastros permitidos.
          </small>
        </div>
        <a className="btn btn-ghost" href="/comece-gratis" target="_blank" rel="noreferrer">
          <Icon name="Share2" size={16} />
          Ver pagina publica
        </a>
      </section>

      <section className="founder-admin-stats">
        <div className="founder-stat card"><span>Cadastradas</span><strong>{program.registered}</strong><small>empresas fundadoras</small></div>
        <div className="founder-stat card"><span>Limite</span><strong>{program.signup_limit}</strong><small>vagas totais</small></div>
        <div className="founder-stat card"><span>Restantes</span><strong>{program.remaining}</strong><small>vagas disponiveis</small></div>
        <div className="founder-stat card"><span>Inscricoes</span><strong>{accepting ? "Abertas" : "Pausadas"}</strong><small>{program.allow_signups ? "entrada liberada" : "entrada bloqueada"}</small></div>
      </section>

      <section className="card card-pad founder-admin-card">
        <div className="founder-section-head">
          <div>
            <h2>Controle do programa</h2>
            <p>Abra ou pause o cadastro publico sem apagar empresas ja criadas.</p>
          </div>
        </div>

        <div className="founder-toggle-grid">
          <label className={`founder-toggle ${program.enabled ? "active" : ""}`}>
            <input type="checkbox" checked={program.enabled} onChange={(event) => update("enabled", event.target.checked)} />
            <span><Icon name={program.enabled ? "Check" : "Circle"} size={16} /></span>
            <div><strong>Programa ativo</strong><small>Liga a campanha Fundadores no sistema.</small></div>
          </label>
          <label className={`founder-toggle ${program.allow_signups ? "active" : ""}`}>
            <input type="checkbox" checked={program.allow_signups} onChange={(event) => update("allow_signups", event.target.checked)} />
            <span><Icon name={program.allow_signups ? "Check" : "UserPlus"} size={16} /></span>
            <div><strong>Permitir novos cadastros</strong><small>Mostra o formulario publico quando o programa esta ativo.</small></div>
          </label>
        </div>

        <div className="form-grid founder-admin-form">
          <div className="field">
            <label>Limite total</label>
            <input type="number" min="1" value={program.signup_limit} onChange={(event) => update("signup_limit", event.target.value)} />
          </div>
          <div className="field">
            <label>Encerramento opcional</label>
            <input type="datetime-local" value={program.ends_at?.slice(0, 16) || ""} onChange={(event) => update("ends_at", event.target.value)} />
          </div>
        </div>
      </section>

      <section className="card card-pad founder-admin-card">
        <div className="founder-section-head">
          <div>
            <h2>Modulos padrao</h2>
            <p>Recursos liberados automaticamente para cada empresa criada pelo programa.</p>
          </div>
          <span className="founder-admin-pill">{defaultModules.length} selecionados</span>
        </div>

        <div className="module-grid founder-admin-modules">
          {data.module_catalog.map((item) => {
            const checked = defaultModules.includes(item.key);
            return (
              <label key={item.key} className={`module-option ${checked ? "active" : ""} ${item.core ? "core" : ""}`}>
                <input type="checkbox" checked={checked} disabled={item.core} onChange={() => toggleModule(item.key)} />
                <span className="module-check"><Icon name={checked ? "Check" : "Plus"} size={14} /></span>
                <span className="module-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                  {item.core && <em>Modulo essencial</em>}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="card founder-admin-table">
        <div className="card-head">
          <div className="ct">Empresas fundadoras</div>
          <div className="grow" />
          <span className="founder-admin-pill">{data.companies.length} empresas</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Empresa</th><th>Subdominio</th><th>Status</th><th>Cadastro</th></tr></thead>
            <tbody>
              {data.companies.map((company) => (
                <tr key={company.id}>
                  <td><strong>{company.name}</strong> <span className="badge">Fundador</span> <span className="badge">Gratuito</span></td>
                  <td>{company.slug}.replymesh.cloud</td>
                  <td>{company.status}</td>
                  <td>{company.founder_registered_at ? new Date(company.founder_registered_at).toLocaleString("pt-BR") : "-"}</td>
                </tr>
              ))}
              {!data.companies.length && (
                <tr>
                  <td colSpan="4">
                    <div className="empty">
                      <div className="et">Nenhuma empresa fundadora cadastrada.</div>
                      <div className="es">Quando alguem concluir a confirmacao por e-mail, a empresa aparece aqui.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
