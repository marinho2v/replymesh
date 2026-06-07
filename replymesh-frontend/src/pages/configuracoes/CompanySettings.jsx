import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../../components/ui/Icon.jsx";
import { Switch } from "../../components/ui/Switch.jsx";
import { PLATFORM_URLS } from "../../config/platform.js";
import { api } from "../../services/api.js";

const TABS = [
  { key: "geral", path: "/configuracoes/geral", label: "Geral", icon: "Store" },
  { key: "identidade", path: "/configuracoes/identidade-visual", label: "Identidade Visual", icon: "Palette" },
  { key: "redes", path: "/configuracoes/redes-sociais", label: "Redes Sociais", icon: "Share2" },
  { key: "entrega", path: "/configuracoes/entrega", label: "Entrega", icon: "Truck" },
  { key: "pix", path: "/configuracoes/pix", label: "PIX", icon: "QrCode" },
  { key: "horarios", path: "/configuracoes/horarios", label: "Horarios", icon: "Clock" },
  { key: "whatsapp", path: "/configuracoes/whatsapp", label: "WhatsApp", icon: "MessageCircle" },
  { key: "infraestrutura", path: "/configuracoes/infraestrutura", label: "Infraestrutura / Dominios", icon: "Globe" },
];

const DAYS = [
  ["monday", "Segunda"],
  ["tuesday", "Terca"],
  ["wednesday", "Quarta"],
  ["thursday", "Quinta"],
  ["friday", "Sexta"],
  ["saturday", "Sabado"],
  ["sunday", "Domingo"],
];

const PAYMENT_METHODS = [
  ["cash", "Dinheiro"],
  ["pix", "PIX"],
  ["debit_card", "Cartao debito"],
  ["credit_card", "Cartao credito"],
  ["online_payment", "Pagamento online"],
];

const EMPTY_FORM = {
  company_id: "",
  company_name: "",
  trade_name: "",
  logo_url: "",
  banner_url: "",
  primary_color: "#16a34a",
  secondary_color: "#0b0b0d",
  whatsapp: "",
  instagram: "",
  facebook: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  delivery_fee: 0,
  free_delivery_above: 0,
  pix_enabled: false,
  pix_key: "",
  pix_key_type: "random",
  opening_hours: Object.fromEntries(
    DAYS.map(([day]) => [day, { enabled: day !== "sunday", open: "18:00", close: "23:00" }])
  ),
  order_message_template: "Ola! Recebemos seu pedido #{order_number}. Em breve enviaremos a confirmacao.",
  accepted_payment_methods: ["cash", "pix", "debit_card", "credit_card"],
};

function normalizeSettings(settings = {}) {
  return {
    ...EMPTY_FORM,
    ...settings,
    company_id: String(settings.company_id || ""),
    opening_hours: { ...EMPTY_FORM.opening_hours, ...(settings.opening_hours || {}) },
    accepted_payment_methods: settings.accepted_payment_methods?.length
      ? settings.accepted_payment_methods
      : EMPTY_FORM.accepted_payment_methods,
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CompanySettings({ onToast }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeTab = useMemo(() => {
    if (location.pathname === "/configuracoes") return TABS[0];
    return TABS.find((tab) => location.pathname === tab.path) || TABS[0];
  }, [location.pathname]);
  const selectedCompany = useMemo(
    () => companies.find((company) => String(company.id) === String(selectedCompanyId)),
    [companies, selectedCompanyId]
  );

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const loadSettings = async (companyId) => {
    if (!companyId) return;

    setError("");
    const data = await api.getCompanySettings(companyId);
    setForm(normalizeSettings(data.settings));
  };

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const companiesData = await api.getCompanies();
        if (!active) return;

        const list = companiesData.companies || [];
        const firstId = String(list[0]?.id || "");
        setCompanies(list);
        setSelectedCompanyId(firstId);

        if (firstId) {
          const settingsData = await api.getCompanySettings(firstId);
          if (!active) return;
          setForm(normalizeSettings(settingsData.settings));
        }
      } catch (err) {
        if (!active) return;
        setError(err.message);
        onToast?.(err.message, "err");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [onToast]);

  const changeCompany = async (companyId) => {
    setSelectedCompanyId(companyId);
    setLoading(true);

    try {
      await loadSettings(companyId);
    } catch (err) {
      setError(err.message);
      onToast?.(err.message, "err");
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (key, file) => {
    if (!file) return;

    try {
      const dataUrl = await readFileAsDataUrl(file);
      set(key, dataUrl);
    } catch {
      onToast?.("Nao foi possivel carregar a imagem", "err");
    }
  };

  const togglePaymentMethod = (method) => {
    setForm((current) => {
      const exists = current.accepted_payment_methods.includes(method);
      return {
        ...current,
        accepted_payment_methods: exists
          ? current.accepted_payment_methods.filter((item) => item !== method)
          : [...current.accepted_payment_methods, method],
      };
    });
  };

  const setOpeningHour = (day, key, value) => {
    setForm((current) => ({
      ...current,
      opening_hours: {
        ...current.opening_hours,
        [day]: { ...current.opening_hours[day], [key]: value },
      },
    }));
  };

  const save = async () => {
    if (!selectedCompanyId) {
      onToast?.("Selecione uma empresa", "err");
      return;
    }

    if (!form.company_name.trim() || !form.trade_name.trim()) {
      onToast?.("Informe nome da empresa e nome fantasia", "err");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        settings: {
          ...form,
          company_id: selectedCompanyId,
        },
      };
      const data = await api.updateCompanySettings(payload);
      setForm(normalizeSettings(data.settings));
      onToast?.("Configuracoes salvas", "ok");
    } catch (err) {
      onToast?.(err.message, "err");
    } finally {
      setSaving(false);
    }
  };

  const renderTab = () => {
    if (loading) return <div className="empty"><div className="et">Carregando configuracoes...</div></div>;

    if (error) {
      return (
        <div className="empty">
          <div className="ei"><Icon name="AlertTriangle" size={22} /></div>
          <div className="et">Erro ao carregar</div>
          <div className="es">{error}</div>
        </div>
      );
    }

    if (activeTab.key === "geral") {
      return (
        <div className="form-grid">
          <div className="field">
            <label>Nome da empresa</label>
            <input value={form.company_name} onChange={(event) => set("company_name", event.target.value)} />
          </div>
          <div className="field">
            <label>Nome fantasia</label>
            <input value={form.trade_name} onChange={(event) => set("trade_name", event.target.value)} />
          </div>
          <div className="field">
            <label>E-mail</label>
            <input type="email" value={form.email || ""} onChange={(event) => set("email", event.target.value)} />
          </div>
          <div className="field">
            <label>WhatsApp principal</label>
            <input value={form.whatsapp || ""} onChange={(event) => set("whatsapp", event.target.value)} />
          </div>
          <div className="field full">
            <label>Endereco</label>
            <input value={form.address || ""} onChange={(event) => set("address", event.target.value)} />
          </div>
          <div className="field">
            <label>Cidade</label>
            <input value={form.city || ""} onChange={(event) => set("city", event.target.value)} />
          </div>
          <div className="field">
            <label>Estado</label>
            <input value={form.state || ""} onChange={(event) => set("state", event.target.value)} />
          </div>
          <div className="field">
            <label>CEP</label>
            <input value={form.zip_code || ""} onChange={(event) => set("zip_code", event.target.value)} />
          </div>
        </div>
      );
    }

    if (activeTab.key === "identidade") {
      return (
        <div className="settings-media-grid">
          <UploadField
            label="Logo"
            value={form.logo_url}
            onChange={(file) => uploadImage("logo_url", file)}
          />
          <UploadField
            label="Banner"
            value={form.banner_url}
            wide
            onChange={(file) => uploadImage("banner_url", file)}
          />
          <div className="field">
            <label>Cor primaria</label>
            <div className="color-line">
              <input type="color" value={form.primary_color || "#16a34a"} onChange={(event) => set("primary_color", event.target.value)} />
              <input value={form.primary_color || ""} onChange={(event) => set("primary_color", event.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Cor secundaria</label>
            <div className="color-line">
              <input type="color" value={form.secondary_color || "#0b0b0d"} onChange={(event) => set("secondary_color", event.target.value)} />
              <input value={form.secondary_color || ""} onChange={(event) => set("secondary_color", event.target.value)} />
            </div>
          </div>
        </div>
      );
    }

    if (activeTab.key === "redes") {
      return (
        <div className="form-grid">
          <div className="field">
            <label>Instagram</label>
            <input value={form.instagram || ""} onChange={(event) => set("instagram", event.target.value)} />
          </div>
          <div className="field">
            <label>Facebook</label>
            <input value={form.facebook || ""} onChange={(event) => set("facebook", event.target.value)} />
          </div>
          <div className="field">
            <label>WhatsApp publico</label>
            <input value={form.whatsapp || ""} onChange={(event) => set("whatsapp", event.target.value)} />
          </div>
          <div className="field">
            <label>E-mail publico</label>
            <input type="email" value={form.email || ""} onChange={(event) => set("email", event.target.value)} />
          </div>
        </div>
      );
    }

    if (activeTab.key === "entrega") {
      return (
        <div className="form-grid">
          <div className="field">
            <label>Taxa de entrega</label>
            <div className="pre">
              <input type="number" min="0" step="0.01" value={form.delivery_fee} onChange={(event) => set("delivery_fee", event.target.value)} />
              <span className="suf">BRL</span>
            </div>
          </div>
          <div className="field">
            <label>Frete gratis acima de</label>
            <div className="pre">
              <input type="number" min="0" step="0.01" value={form.free_delivery_above} onChange={(event) => set("free_delivery_above", event.target.value)} />
              <span className="suf">BRL</span>
            </div>
          </div>
          <div className="field full">
            <label>Formas de pagamento aceitas</label>
            <div className="settings-check-grid">
              {PAYMENT_METHODS.map(([method, label]) => (
                <label key={method} className="settings-check">
                  <input
                    type="checkbox"
                    checked={form.accepted_payment_methods.includes(method)}
                    onChange={() => togglePaymentMethod(method)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab.key === "pix") {
      return (
        <div className="form-grid">
          <div className="field full">
            <div className="settings-toggle">
              <div>
                <strong>PIX habilitado</strong>
                <span>Permite exibir chave PIX nas instrucoes de pagamento.</span>
              </div>
              <Switch on={Boolean(form.pix_enabled)} onClick={() => set("pix_enabled", !form.pix_enabled)} />
            </div>
          </div>
          <div className="field">
            <label>Tipo da chave</label>
            <select value={form.pix_key_type || "random"} onChange={(event) => set("pix_key_type", event.target.value)}>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
              <option value="random">Chave aleatoria</option>
            </select>
          </div>
          <div className="field">
            <label>Chave PIX</label>
            <input value={form.pix_key || ""} onChange={(event) => set("pix_key", event.target.value)} />
          </div>
        </div>
      );
    }

    if (activeTab.key === "horarios") {
      return (
        <div className="settings-hours">
          {DAYS.map(([day, label]) => {
            const item = form.opening_hours[day] || EMPTY_FORM.opening_hours[day];
            return (
              <div className="settings-hour-row" key={day}>
                <div className="settings-hour-day">
                  <strong>{label}</strong>
                  <span>{item.enabled ? "Aberto" : "Fechado"}</span>
                </div>
                <Switch on={Boolean(item.enabled)} onClick={() => setOpeningHour(day, "enabled", !item.enabled)} />
                <input type="time" value={item.open || "18:00"} onChange={(event) => setOpeningHour(day, "open", event.target.value)} disabled={!item.enabled} />
                <input type="time" value={item.close || "23:00"} onChange={(event) => setOpeningHour(day, "close", event.target.value)} disabled={!item.enabled} />
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab.key === "infraestrutura") {
      const companySubdomain = selectedCompany?.subdomain || selectedCompany?.primary_domain || `${selectedCompany?.slug || "empresa"}${PLATFORM_URLS.subdomainSuffix}`;

      return (
        <div className="form-grid">
          <InfoCard
            icon="Globe"
            title="Subdominio padrao"
            value={companySubdomain}
            description="Endereco oficial da loja na Replymesh. Em producao, o DNS wildcard *.replymesh.cloud apontara para o template da loja."
          />
          <InfoCard
            icon="LayoutDashboard"
            title="Painel Master"
            value={PLATFORM_URLS.master}
            description="Endereco reservado para a administracao da plataforma."
          />
          <InfoCard
            icon="Server"
            title="API Rails"
            value={PLATFORM_URLS.api}
            description="Endereco reservado para a API em producao."
          />
          <InfoCard
            icon="Link"
            title="Dominio proprio"
            value={selectedCompany?.custom_domain || "Em breve"}
            description="Estrutura preparada para status pending, verified, active e failed. A verificacao DNS fica para a VPS."
          />
        </div>
      );
    }

    return (
      <div className="form-grid">
        <div className="field">
          <label>WhatsApp de atendimento</label>
          <input value={form.whatsapp || ""} onChange={(event) => set("whatsapp", event.target.value)} />
        </div>
        <div className="field full">
          <label>Mensagem padrao do pedido</label>
          <textarea
            rows={5}
            value={form.order_message_template || ""}
            onChange={(event) => set("order_message_template", event.target.value)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Configuracoes da Empresa</h1>
          <p className="ps">Ajustes operacionais vinculados ao company_id.</p>
        </div>
        <div className="grow" />
        <button className="btn btn-primary" onClick={save} disabled={saving || loading}>
          <Icon name="Save" size={16} />
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      <div className="toolbar">
        <div className="field settings-company-select">
          <label>Empresa</label>
          <select value={selectedCompanyId} onChange={(event) => changeCompany(event.target.value)}>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>
        <div className="tabs settings-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab ${activeTab.key === tab.key ? "active" : ""}`}
              onClick={() => navigate(tab.path)}
            >
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-pad">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, value, description }) {
  return (
    <div className="settings-info-card">
      <div className="settings-info-icon"><Icon name={icon} size={18} /></div>
      <div>
        <strong>{title}</strong>
        <code>{value}</code>
        <span>{description}</span>
      </div>
    </div>
  );
}

function UploadField({ label, value, wide = false, onChange }) {
  return (
    <div className={`field settings-upload ${wide ? "wide" : ""}`}>
      <label>{label}</label>
      <div className={`settings-upload-box ${wide ? "wide" : ""}`}>
        {value ? (
          <img src={value} alt={label} />
        ) : (
          <div className="settings-upload-empty">
            <Icon name="ImagePlus" size={24} />
            <span>Enviar imagem</span>
          </div>
        )}
      </div>
      <input type="file" accept="image/*" onChange={(event) => onChange(event.target.files?.[0])} />
    </div>
  );
}
