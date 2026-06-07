import { useEffect, useState } from "react";
import { Icon } from "../../components/ui/Icon.jsx";
import { api } from "../../services/api.js";

const EMPTY = { platform_name: "Replymesh", light_logo_url: "", dark_logo_url: "", favicon_url: "", primary_color: "#18181b", secondary_color: "#16a34a", support_email: "", support_whatsapp: "" };

export function MasterBranding({ onToast }) {
  const [form, setForm] = useState(EMPTY);
  useEffect(() => { api.getMasterBranding().then((data) => setForm({ ...EMPTY, ...data.branding })).catch((error) => onToast?.(error.message, "err")); }, [onToast]);
  const save = async () => {
    try { const data = await api.updateMasterBranding(form); setForm(data.branding); window.dispatchEvent(new Event("replymesh:branding-updated")); onToast?.("Marca do painel atualizada", "ok"); } catch (error) { onToast?.(error.message, "err"); }
  };
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="page fade-up"><div className="page-head"><div><div className="pt">Aparencia e marca</div><div className="ps">Identidade visual exclusiva do painel master Replymesh.</div></div><div className="grow" /><button className="btn btn-primary" onClick={save}><Icon name="Save" size={16} /> Salvar marca</button></div>
    <div className="grid-2 branding-grid"><section className="card card-pad"><h3 className="section-title">Identidade</h3><div className="form-stack"><div className="field"><label>Nome da plataforma</label><input value={form.platform_name} onChange={(event) => set("platform_name", event.target.value)} /></div><div className="field"><label>Logo clara URL</label><input value={form.light_logo_url || ""} onChange={(event) => set("light_logo_url", event.target.value)} /></div><div className="field"><label>Logo escura URL</label><input value={form.dark_logo_url || ""} onChange={(event) => set("dark_logo_url", event.target.value)} /></div><div className="field"><label>Favicon URL</label><input value={form.favicon_url || ""} onChange={(event) => set("favicon_url", event.target.value)} /></div></div></section>
    <section className="card card-pad"><h3 className="section-title">Cores e suporte</h3><div className="form-stack"><div className="field"><label>Cor principal</label><div className="color-line"><input type="color" value={form.primary_color} onChange={(event) => set("primary_color", event.target.value)} /><input value={form.primary_color} onChange={(event) => set("primary_color", event.target.value)} /></div></div><div className="field"><label>Cor secundaria</label><div className="color-line"><input type="color" value={form.secondary_color} onChange={(event) => set("secondary_color", event.target.value)} /><input value={form.secondary_color} onChange={(event) => set("secondary_color", event.target.value)} /></div></div><div className="field"><label>Email de suporte</label><input value={form.support_email || ""} onChange={(event) => set("support_email", event.target.value)} /></div><div className="field"><label>WhatsApp de suporte</label><input value={form.support_whatsapp || ""} onChange={(event) => set("support_whatsapp", event.target.value)} /></div></div></section></div>
  </div>;
}
