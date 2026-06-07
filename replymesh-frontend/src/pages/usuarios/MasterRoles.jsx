import { useEffect, useState } from "react";
import { Icon } from "../../components/ui/Icon.jsx";
import { api } from "../../services/api.js";

const GROUPS = {
  Empresas: ["companies.view", "companies.create", "companies.edit", "companies.suspend", "companies.delete", "impersonate_company"],
  Tickets: ["tickets.view", "tickets.reply", "tickets.status"],
  Financeiro: ["finance.subscriptions", "finance.change_plan", "finance.payments"],
  Configuracoes: ["settings.ai", "settings.brand", "settings.updates"],
  Usuarios: ["users.create", "users.edit", "users.permissions"],
  Logs: ["logs.audit", "view_audit_logs", "manage_audit_logs"],
};

const LABELS = {
  "companies.view": "Visualizar", "companies.create": "Criar", "companies.edit": "Editar", "companies.suspend": "Suspender", "companies.delete": "Excluir",
  "impersonate_company": "Entrar como empresa",
  "tickets.view": "Visualizar", "tickets.reply": "Responder", "tickets.status": "Alterar status",
  "finance.subscriptions": "Visualizar assinaturas", "finance.change_plan": "Alterar plano", "finance.payments": "Ver pagamentos",
  "settings.ai": "Editar IA", "settings.brand": "Editar identidade visual", "settings.updates": "Editar atualizacoes",
  "users.create": "Criar usuarios", "users.edit": "Editar usuarios", "users.permissions": "Alterar permissoes", "logs.audit": "Logs operacionais",
  "view_audit_logs": "Visualizar auditoria master", "manage_audit_logs": "Gerenciar auditoria master",
};

export function MasterRoles({ onToast }) {
  const [roles, setRoles] = useState([]);
  const [editing, setEditing] = useState(null);
  const load = async () => {
    try { setRoles((await api.getMasterRoles()).roles || []); } catch (error) { onToast?.(error.message, "err"); }
  };
  useEffect(() => {
    let alive = true;
    api.getMasterRoles()
      .then((data) => alive && setRoles(data.roles || []))
      .catch((error) => alive && onToast?.(error.message, "err"));
    return () => { alive = false; };
  }, [onToast]);
  const save = async () => {
    try {
      const payload = { name: editing.name, key: editing.key, description: editing.description, status: editing.status, permissions: editing.permissions || {} };
      if (editing.id) await api.updateMasterRole(editing.id, payload); else await api.createMasterRole(payload);
      setEditing(null); await load(); onToast?.("Funcao salva", "ok");
    } catch (error) { onToast?.(error.message, "err"); }
  };
  const toggle = (key) => setEditing({ ...editing, permissions: { ...editing.permissions, [key]: !editing.permissions?.[key] } });
  return <div className="page fade-up">
    <div className="page-head"><div><div className="pt">Funcoes e permissoes</div><div className="ps">Controle o que cada integrante da equipe interna pode acessar.</div></div><div className="grow" /><button className="btn btn-primary" onClick={() => setEditing({ name: "", key: "", description: "", status: "active", permissions: {} })}><Icon name="Plus" size={16} /> Nova funcao</button></div>
    <div className="roles-grid">{roles.map((role) => <article className="card role-card" key={role.id}><div className="role-card-head"><div><h3>{role.name}</h3><p>{role.description}</p></div><button className="ra" onClick={() => setEditing(role)}><Icon name="Pencil" size={16} /></button></div><div className="role-summary"><span>{role.users_count} usuarios</span><span>{Object.values(role.permissions || {}).filter(Boolean).length} permissoes</span></div></article>)}</div>
    {editing && <div className="modal-backdrop"><div className="modal master-modal wide"><div className="card-head"><div className="ct">{editing.id ? "Editar funcao" : "Nova funcao"}</div><div className="grow" /><button className="ra" onClick={() => setEditing(null)}><Icon name="X" size={17} /></button></div><div className="modal-body">
      <div className="form-grid"><div className="field"><label>Nome</label><input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></div><div className="field"><label>Chave</label><input value={editing.key} onChange={(event) => setEditing({ ...editing, key: event.target.value })} /></div><div className="field full"><label>Descricao</label><input value={editing.description || ""} onChange={(event) => setEditing({ ...editing, description: event.target.value })} /></div></div>
      <div className="permission-groups">{Object.entries(GROUPS).map(([group, keys]) => <section key={group}><h4>{group}</h4>{keys.map((key) => <label className="permission-row" key={key}><span>{LABELS[key]}</span><input type="checkbox" checked={!!editing.permissions?.[key]} onChange={() => toggle(key)} /></label>)}</section>)}</div>
    </div><div className="modal-actions"><button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar funcao</button></div></div></div>}
  </div>;
}
