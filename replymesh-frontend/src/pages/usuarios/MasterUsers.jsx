import { useEffect, useMemo, useState } from "react";
import { Badge } from "../../components/ui/Badge.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { api } from "../../services/api.js";

const EMPTY = { name: "", email: "", phone: "", avatar_url: "", master_role_id: "", status: "active", password: "" };

function fmt(value) {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function MasterUsers({ onToast }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([api.getMasterUsers(), api.getMasterRoles()]);
      setUsers(usersData.users || []);
      setRoles((rolesData.roles || []).filter((role) => role.status === "active"));
    } catch (error) {
      onToast?.(error.message, "err");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    Promise.all([api.getMasterUsers(), api.getMasterRoles()])
      .then(([usersData, rolesData]) => {
        if (!alive) return;
        setUsers(usersData.users || []);
        setRoles((rolesData.roles || []).filter((role) => role.status === "active"));
      })
      .catch((error) => alive && onToast?.(error.message, "err"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [onToast]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) => `${user.name} ${user.email} ${user.role_name}`.toLowerCase().includes(needle));
  }, [users, query]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (form.id) await api.updateMasterUser(form.id, payload);
      else await api.createMasterUser(payload);
      onToast?.(form.id ? "Usuario atualizado" : "Usuario master criado", "ok");
      setForm(null);
      await load();
    } catch (error) {
      onToast?.(error.message, "err");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (user) => {
    try {
      await api.updateMasterUserStatus(user.id, user.status === "active" ? "inactive" : "active");
      onToast?.("Status atualizado", "ok");
      await load();
    } catch (error) {
      onToast?.(error.message, "err");
    }
  };

  const resetPassword = async (user) => {
    const password = window.prompt(`Nova senha para ${user.name}:`);
    if (!password) return;
    try {
      await api.resetMasterUserPassword(user.id, password);
      onToast?.("Senha redefinida", "ok");
    } catch (error) {
      onToast?.(error.message, "err");
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Remover o acesso master de ${user.name}?`)) return;
    try {
      await api.removeMasterUser(user.id);
      onToast?.("Acesso master removido", "ok");
      await load();
    } catch (error) {
      onToast?.(error.message, "err");
    }
  };

  return (
    <div className="page fade-up">
      <div className="page-head">
        <div><div className="pt">Usuarios Master</div><div className="ps">Equipe interna da Replymesh, cargos e acessos administrativos.</div></div>
        <div className="grow" />
        <button className="btn btn-primary" onClick={() => setForm({ ...EMPTY })}><Icon name="UserPlus" size={16} /> Novo usuario</button>
      </div>
      <div className="toolbar">
        <div className="field-search"><Icon name="Search" size={16} className="si" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, email ou cargo..." /></div>
        <div className="grow" />
        <Badge tone="blue" dot={false}>{users.length} usuarios internos</Badge>
      </div>
      <div className="card"><div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Usuario</th><th>Telefone</th><th>Funcao</th><th>Status</th><th>Ultimo acesso</th><th>Criado em</th><th style={{ textAlign: "right" }}>Acoes</th></tr></thead>
        <tbody>
          {loading && <tr><td colSpan="7"><div className="empty"><Icon name="LoaderCircle" className="spin" /> Carregando equipe...</div></td></tr>}
          {!loading && filtered.map((user) => <tr key={user.id}>
            <td><div className="cell-co"><span className="avatar">{user.avatar_url ? <img src={user.avatar_url} alt="" /> : user.name?.slice(0, 2).toUpperCase()}</span><div><div className="t">{user.name}</div><div className="s">{user.email}</div></div></div></td>
            <td>{user.phone || "-"}</td><td>{user.role_name || "Sem funcao"}</td>
            <td><Badge tone={user.status === "active" ? "green" : "gray"}>{user.status === "active" ? "Ativo" : "Inativo"}</Badge></td>
            <td>{fmt(user.last_sign_in_at)}</td><td>{fmt(user.created_at)}</td>
            <td><div className="row-actions" style={{ justifyContent: "flex-end" }}>
              <button className="ra" title="Editar" onClick={() => setForm({ ...EMPTY, ...user, master_role_id: user.master_role?.id || "" })}><Icon name="Pencil" size={15} /></button>
              <button className="ra" title="Redefinir senha" onClick={() => resetPassword(user)}><Icon name="KeyRound" size={15} /></button>
              <button className="ra" title={user.status === "active" ? "Desativar" : "Ativar"} onClick={() => changeStatus(user)}><Icon name={user.status === "active" ? "UserX" : "UserCheck"} size={15} /></button>
              {!user.super_admin && <button className="ra danger-icon" title="Remover acesso" onClick={() => remove(user)}><Icon name="Trash2" size={15} /></button>}
            </div></td>
          </tr>)}
          {!loading && filtered.length === 0 && <tr><td colSpan="7"><div className="empty"><div className="et">Nenhum usuario encontrado</div></div></td></tr>}
        </tbody>
      </table></div></div>
      {form && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setForm(null)}><div className="modal master-modal">
        <div className="card-head"><div className="ct">{form.id ? "Editar usuario" : "Novo usuario master"}</div><div className="grow" /><button className="ra" onClick={() => setForm(null)}><Icon name="X" size={17} /></button></div>
        <div className="modal-body form-grid">
          <div className="field"><label>Nome</label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
          <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
          <div className="field"><label>Telefone</label><input value={form.phone || ""} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
          <div className="field"><label>Avatar URL</label><input value={form.avatar_url || ""} onChange={(event) => setForm({ ...form, avatar_url: event.target.value })} /></div>
          <div className="field"><label>Funcao</label><select value={form.master_role_id || ""} onChange={(event) => setForm({ ...form, master_role_id: event.target.value })} disabled={form.global_role === "super_admin"}><option value="">Selecione</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></div>
          <div className="field"><label>Status</label><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Ativo</option><option value="inactive">Inativo</option><option value="suspended">Suspenso</option></select></div>
          {!form.id && <div className="field full"><label>Senha inicial</label><input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Minimo de 8 caracteres" /></div>}
        </div>
        <div className="modal-actions"><button className="btn btn-ghost" onClick={() => setForm(null)}>Cancelar</button><button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "Salvando..." : "Salvar usuario"}</button></div>
      </div></div>}
    </div>
  );
}
