import { useEffect, useState } from "react";
import { Icon } from "../../components/ui/Icon.jsx";
import { api, getAuthToken, saveSession } from "../../services/api.js";

export function MasterProfile({ onToast }) {
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", avatar_url: "" });
  const [password, setPassword] = useState({ current_password: "", new_password: "", password_confirmation: "" });
  useEffect(() => { api.getMasterProfile().then((data) => setProfile(data.profile)).catch((error) => onToast?.(error.message, "err")); }, [onToast]);
  const save = async () => {
    try {
      const data = await api.updateMasterProfile(profile);
      setProfile(data.profile);
      saveSession({ token: getAuthToken(), user: data.profile });
      window.dispatchEvent(new CustomEvent("replymesh:user-updated", { detail: data.profile }));
      onToast?.("Perfil atualizado", "ok");
    } catch (error) { onToast?.(error.message, "err"); }
  };
  const changePassword = async () => {
    try { await api.updateMasterPassword(password); setPassword({ current_password: "", new_password: "", password_confirmation: "" }); onToast?.("Senha alterada", "ok"); } catch (error) { onToast?.(error.message, "err"); }
  };
  return <div className="page fade-up"><div className="page-head"><div><div className="pt">Meu perfil</div><div className="ps">Dados pessoais e seguranca da sua conta master.</div></div></div><div className="grid-2 profile-grid">
    <section className="card card-pad"><h3 className="section-title">Dados do perfil</h3><div className="profile-preview"><span className="avatar large">{profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : profile.name?.slice(0, 2).toUpperCase()}</span><div><strong>{profile.name}</strong><span>{profile.email}</span></div></div><div className="form-grid"><div className="field"><label>Nome</label><input value={profile.name || ""} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></div><div className="field"><label>Email</label><input value={profile.email || ""} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></div><div className="field"><label>Telefone</label><input value={profile.phone || ""} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></div><div className="field"><label>Avatar URL</label><input value={profile.avatar_url || ""} onChange={(event) => setProfile({ ...profile, avatar_url: event.target.value })} /></div></div><button className="btn btn-primary" onClick={save}><Icon name="Save" size={16} /> Salvar perfil</button></section>
    <section className="card card-pad"><h3 className="section-title">Alterar senha</h3><div className="form-stack"><div className="field"><label>Senha atual</label><input type="password" value={password.current_password} onChange={(event) => setPassword({ ...password, current_password: event.target.value })} /></div><div className="field"><label>Nova senha</label><input type="password" value={password.new_password} onChange={(event) => setPassword({ ...password, new_password: event.target.value })} /></div><div className="field"><label>Confirmar nova senha</label><input type="password" value={password.password_confirmation} onChange={(event) => setPassword({ ...password, password_confirmation: event.target.value })} /></div></div><button className="btn btn-ghost" onClick={changePassword}><Icon name="KeyRound" size={16} /> Alterar senha</button></section>
  </div></div>;
}
