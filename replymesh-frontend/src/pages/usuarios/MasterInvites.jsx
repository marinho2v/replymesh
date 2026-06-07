import { useEffect, useState } from "react";
import { Badge } from "../../components/ui/Badge.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { api } from "../../services/api.js";

export function MasterInvites({ onToast }) {
  const [invites, setInvites] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", master_role_id: "" });
  const load = async () => {
    try {
      const [a, b] = await Promise.all([api.getMasterInvites(), api.getMasterRoles()]);
      setInvites(a.invites || []); setRoles((b.roles || []).filter((role) => role.status === "active"));
    } catch (error) { onToast?.(error.message, "err"); }
  };
  useEffect(() => {
    let alive = true;
    Promise.all([api.getMasterInvites(), api.getMasterRoles()])
      .then(([a, b]) => {
        if (!alive) return;
        setInvites(a.invites || []);
        setRoles((b.roles || []).filter((role) => role.status === "active"));
      })
      .catch((error) => alive && onToast?.(error.message, "err"));
    return () => { alive = false; };
  }, [onToast]);
  const create = async () => {
    try { await api.createMasterInvite(form); setForm({ name: "", email: "", master_role_id: "" }); await load(); onToast?.("Convite local criado", "ok"); } catch (error) { onToast?.(error.message, "err"); }
  };
  const action = async (invite, type) => {
    try { await (type === "cancel" ? api.cancelMasterInvite(invite.id) : api.resendMasterInvite(invite.id)); await load(); onToast?.(type === "cancel" ? "Convite cancelado" : "Convite renovado", "ok"); } catch (error) { onToast?.(error.message, "err"); }
  };
  const copy = async (url) => { await navigator.clipboard.writeText(url); onToast?.("Link copiado", "ok"); };
  return <div className="page fade-up"><div className="page-head"><div><div className="pt">Convites</div><div className="ps">Gere acessos locais para novos integrantes da equipe master.</div></div></div>
    <div className="grid-2 invite-layout"><section className="card card-pad"><h3 className="section-title">Novo convite</h3><div className="form-grid"><div className="field"><label>Nome</label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div><div className="field"><label>Email</label><input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div><div className="field full"><label>Funcao</label><select value={form.master_role_id} onChange={(event) => setForm({ ...form, master_role_id: event.target.value })}><option value="">Selecione</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></div></div><button className="btn btn-primary" onClick={create}><Icon name="MailPlus" size={16} /> Gerar convite</button><p className="muted helper-text">O envio por email fica para a infraestrutura futura. Nesta fase o link e local.</p></section>
    <section className="card"><div className="card-head"><div className="ct">Convites gerados</div></div>{invites.length === 0 ? <div className="empty"><div className="et">Nenhum convite</div></div> : invites.map((invite) => <div className="invite-row" key={invite.id}><div className="invite-main"><strong>{invite.name || invite.email}</strong><span>{invite.email} · {invite.role.name}</span><code>{invite.invite_url}</code></div><Badge tone={invite.status === "pending" ? "amber" : invite.status === "canceled" ? "red" : "gray"}>{invite.status}</Badge><div className="row-actions"><button className="ra" title="Copiar link" onClick={() => copy(invite.invite_url)}><Icon name="Copy" size={15} /></button><button className="ra" title="Reenviar/renovar" onClick={() => action(invite, "resend")}><Icon name="RefreshCw" size={15} /></button><button className="ra danger-icon" title="Cancelar" onClick={() => action(invite, "cancel")}><Icon name="Ban" size={15} /></button></div></div>)}</section></div>
  </div>;
}
