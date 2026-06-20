import { useEffect, useMemo, useState } from "react";
import { Icon } from "../../components/ui/Icon.jsx";
import { api } from "../../services/api.js";

const EMPTY = {
  platform_name: "Replymesh",
  light_logo_url: "",
  dark_logo_url: "",
  favicon_url: "",
  primary_color: "#18181b",
  secondary_color: "#16a34a",
  support_email: "",
  support_whatsapp: "",
  support_location: "",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  landing_logo_url: "",
  landing_hero_image_url: "",
  landing_clients: [],
};

const EMPTY_CLIENT = { name: "", type: "", logo_url: "", site_url: "" };
const DEFAULT_LANDING_LOGO = "/mark.png";
const DEFAULT_HERO_IMAGE = "/mockup.png";
const DEFAULT_CLIENTS = [
  { name: "Lanche do 2R", type: "Hamburgueria", logo_url: "/clients/lanche-do-2r.png", site_url: "https://lanchesdo2r.com.br" },
  { name: "Petisco da Paty", type: "Delivery", logo_url: "/clients/petisco-da-paty.png", site_url: "" },
  { name: "Pizza Show", type: "Pizzaria", logo_url: "/clients/pizza-show.png", site_url: "" },
];

function PreviewImage({ label, url }) {
  return (
    <div className="branding-preview">
      <span>{label}</span>
      {url ? <img src={url} alt={label} /> : <div className="branding-preview-empty"><Icon name="Image" size={18} /> Sem imagem</div>}
    </div>
  );
}

export function MasterBranding({ onToast }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.getMasterBranding()
      .then((data) => {
        if (!alive) return;
        const receivedClients = data.branding?.landing_clients;
        setForm({
          ...EMPTY,
          ...data.branding,
          landing_clients: Array.isArray(receivedClients) && receivedClients.length ? receivedClients : DEFAULT_CLIENTS,
        });
      })
      .catch((error) => onToast?.(error.message, "err"))
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [onToast]);

  const clients = useMemo(() => (Array.isArray(form.landing_clients) ? form.landing_clients : []), [form.landing_clients]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const setClient = (index, key, value) => {
    setForm((current) => ({
      ...current,
      landing_clients: (Array.isArray(current.landing_clients) ? current.landing_clients : []).map((client, currentIndex) => (
        currentIndex === index ? { ...client, [key]: value } : client
      )),
    }));
  };

  const addClient = () => {
    setForm((current) => ({ ...current, landing_clients: [...clients, { ...EMPTY_CLIENT }] }));
  };

  const removeClient = (index) => {
    setForm((current) => ({ ...current, landing_clients: clients.filter((_, currentIndex) => currentIndex !== index) }));
  };

  const save = async () => {
    const payload = {
      ...form,
      landing_clients: clients
        .map((client) => ({
          name: client.name?.trim() || "",
          type: client.type?.trim() || "",
          logo_url: client.logo_url?.trim() || "",
          site_url: client.site_url?.trim() || "",
        }))
        .filter((client) => client.name),
    };

    try {
      const data = await api.updateMasterBranding(payload);
      const receivedClients = data.branding?.landing_clients;
      setForm({
        ...EMPTY,
        ...data.branding,
        landing_clients: Array.isArray(receivedClients) && receivedClients.length ? receivedClients : DEFAULT_CLIENTS,
      });
      window.dispatchEvent(new Event("replymesh:branding-updated"));
      onToast?.("Marca e pagina principal atualizadas", "ok");
    } catch (error) {
      onToast?.(error.message, "err");
    }
  };

  if (loading) {
    return <div className="page fade-up"><div className="route-loader" role="status">Carregando marca...</div></div>;
  }

  return (
    <div className="page fade-up">
      <div className="page-head">
        <div>
          <div className="pt">Aparencia e marca</div>
          <div className="ps">Controle a identidade do painel Master e da pagina principal da Replymesh.</div>
        </div>
        <div className="grow" />
        <button className="btn btn-primary" onClick={save}><Icon name="Save" size={16} /> Salvar marca</button>
      </div>

      <div className="grid-2 branding-grid">
        <section className="card card-pad">
          <h3 className="section-title">Painel Master</h3>
          <div className="form-stack">
            <div className="field"><label>Nome da plataforma</label><input value={form.platform_name} onChange={(event) => set("platform_name", event.target.value)} /></div>
            <div className="field"><label>Logo clara URL</label><input value={form.light_logo_url || ""} onChange={(event) => set("light_logo_url", event.target.value)} /></div>
            <div className="field"><label>Logo escura URL</label><input value={form.dark_logo_url || ""} onChange={(event) => set("dark_logo_url", event.target.value)} /></div>
            <div className="field"><label>Favicon URL</label><input value={form.favicon_url || ""} onChange={(event) => set("favicon_url", event.target.value)} /></div>
          </div>
          <div className="branding-preview-row">
            <PreviewImage label="Logo clara" url={form.light_logo_url || DEFAULT_LANDING_LOGO} />
            <PreviewImage label="Logo escura" url={form.dark_logo_url || DEFAULT_LANDING_LOGO} />
          </div>
        </section>

        <section className="card card-pad">
          <h3 className="section-title">Cores e suporte</h3>
          <div className="form-stack">
            <div className="field"><label>Cor principal</label><div className="color-line"><input type="color" value={form.primary_color} onChange={(event) => set("primary_color", event.target.value)} /><input value={form.primary_color} onChange={(event) => set("primary_color", event.target.value)} /></div></div>
            <div className="field"><label>Cor secundaria</label><div className="color-line"><input type="color" value={form.secondary_color} onChange={(event) => set("secondary_color", event.target.value)} /><input value={form.secondary_color} onChange={(event) => set("secondary_color", event.target.value)} /></div></div>
            <div className="field"><label>Email de suporte</label><input value={form.support_email || ""} onChange={(event) => set("support_email", event.target.value)} /></div>
            <div className="field"><label>WhatsApp de suporte</label><input value={form.support_whatsapp || ""} onChange={(event) => set("support_whatsapp", event.target.value)} /></div>
            <div className="field"><label>Localizacao</label><input value={form.support_location || ""} onChange={(event) => set("support_location", event.target.value)} placeholder="Rio de Janeiro - RJ" /></div>
            <div className="field"><label>Instagram URL</label><input value={form.instagram_url || ""} onChange={(event) => set("instagram_url", event.target.value)} placeholder="https://instagram.com/replymesh" /></div>
            <div className="field"><label>Facebook URL</label><input value={form.facebook_url || ""} onChange={(event) => set("facebook_url", event.target.value)} placeholder="https://facebook.com/replymesh" /></div>
            <div className="field"><label>YouTube URL</label><input value={form.youtube_url || ""} onChange={(event) => set("youtube_url", event.target.value)} placeholder="https://youtube.com/@replymesh" /></div>
          </div>
        </section>
      </div>

      <section className="card card-pad branding-landing-card">
        <div className="section-head-line">
          <div>
            <h3 className="section-title">Pagina principal</h3>
            <p className="muted">Altere o logo do topo, a imagem principal e os clientes exibidos na landing.</p>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-stack">
            <div className="field"><label>Logo da pagina principal URL</label><input value={form.landing_logo_url || ""} onChange={(event) => set("landing_logo_url", event.target.value)} placeholder={DEFAULT_LANDING_LOGO} /></div>
            <div className="field"><label>Imagem hero URL</label><input value={form.landing_hero_image_url || ""} onChange={(event) => set("landing_hero_image_url", event.target.value)} placeholder={DEFAULT_HERO_IMAGE} /></div>
          </div>
          <div className="branding-preview-row">
            <PreviewImage label="Logo landing" url={form.landing_logo_url || form.light_logo_url || DEFAULT_LANDING_LOGO} />
            <PreviewImage label="Hero" url={form.landing_hero_image_url || DEFAULT_HERO_IMAGE} />
          </div>
        </div>
      </section>

      <section className="card card-pad branding-clients-card">
        <div className="section-head-line">
          <div>
            <h3 className="section-title">Clientes e parceiros</h3>
            <p className="muted">Esses cards aparecem na secao Clientes da pagina principal. O link e opcional.</p>
          </div>
          <button className="btn btn-ghost" onClick={addClient}><Icon name="Plus" size={16} /> Adicionar cliente</button>
        </div>

        <div className="branding-client-list">
          {clients.map((client, index) => (
            <div className="branding-client-row" key={index}>
              <PreviewImage label={client.name || "Cliente"} url={client.logo_url} />
              <div className="branding-client-fields">
                <div className="grid-2">
                  <div className="field"><label>Nome</label><input value={client.name || ""} onChange={(event) => setClient(index, "name", event.target.value)} /></div>
                  <div className="field"><label>Tipo</label><input value={client.type || ""} onChange={(event) => setClient(index, "type", event.target.value)} placeholder="Pizzaria, Hamburgueria..." /></div>
                </div>
                <div className="field"><label>Logo URL</label><input value={client.logo_url || ""} onChange={(event) => setClient(index, "logo_url", event.target.value)} /></div>
                <div className="field"><label>Link ao clicar</label><input value={client.site_url || ""} onChange={(event) => setClient(index, "site_url", event.target.value)} placeholder="https://..." /></div>
              </div>
              <button className="btn btn-danger" onClick={() => removeClient(index)}><Icon name="Trash2" size={16} /> Remover</button>
            </div>
          ))}
          {!clients.length && <div className="empty-state">Nenhum cliente cadastrado para a pagina principal.</div>}
        </div>
      </section>
    </div>
  );
}
