import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "../../components/ui/Badge.jsx";
import { CoAvatar } from "../../components/ui/CoAvatar.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { NUM } from "../../lib/utils.js";
import { api } from "../../services/api.js";

const WA_TABS = [
  { id: "instancias", label: "Instancias", icon: "Smartphone", path: "/whatsapp" },
  { id: "qrcode", label: "QR Code", icon: "QrCode", path: "/whatsapp/qrcode" },
  { id: "templates", label: "Templates", icon: "MessageSquare", path: "/whatsapp/templates" },
  { id: "logs", label: "Logs", icon: "ScrollText", path: "/whatsapp/logs" },
];

const STATUS = {
  not_created: ["gray", "Nao criada"],
  created: ["blue", "Criada"],
  connecting: ["amber", "Conectando"],
  connected: ["green", "Conectada"],
  disconnected: ["red", "Desconectada"],
  error: ["red", "Erro"],
};

const LOG_LEVEL = {
  ok: ["green", "OK"],
  info: ["blue", "INFO"],
  warn: ["amber", "WARN"],
  err: ["red", "ERR"],
};

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function WhatsApp({ onToast }) {
  const navigate = useNavigate();
  const params = useParams();
  const active = WA_TABS.find((tab) => tab.id === params.tab)?.id || "instancias";

  return (
    <div className="page fade-up">
      <div className="page-head">
        <div>
          <div className="pt">WhatsApp</div>
          <div className="ps">Instancias, conexoes, templates e registros via Rails + Evolution Go</div>
        </div>
        <div className="grow" />
        <button className="btn btn-ghost" onClick={() => api.testEvolutionConnection().then(() => onToast?.("Evolution Go conectada", "ok")).catch((err) => onToast?.(err.message, "err"))}>
          <Icon name="PlugZap" size={15} /> Testar conexao
        </button>
        <button className="btn btn-primary" onClick={() => navigate("/whatsapp/qrcode")}><Icon name="QrCode" size={17} /> QR Code</button>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {WA_TABS.map((tab) => (
            <button key={tab.id} className={`tab${active === tab.id ? " active" : ""}`} onClick={() => navigate(tab.path)}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Icon name={tab.icon} size={15} /> {tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {active === "instancias" && <WAInstances onToast={onToast} />}
      {active === "qrcode" && <WAQrCode onToast={onToast} />}
      {active === "templates" && <WATemplates onToast={onToast} />}
      {active === "logs" && <WALogs onToast={onToast} />}
    </div>
  );
}

function WAInstances({ onToast }) {
  const navigate = useNavigate();
  const [instances, setInstances] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);

  const load = async () => {
    const data = await api.getWhatsappInstances();
    setInstances(data.instances || []);
    setMetrics(data.metrics || null);
  };

  useEffect(() => {
    let active = true;
    api.getWhatsappInstances()
      .then((data) => {
        if (!active) return;
        setInstances(data.instances || []);
        setMetrics(data.metrics || null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        onToast?.(err.message, "err");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onToast]);

  const run = async (instance, action, message) => {
    setActionId(instance.id);
    try {
      await action(instance.id);
      await load();
      onToast?.(message, "ok");
    } catch (err) {
      onToast?.(err.message, "err");
    } finally {
      setActionId(null);
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const data = await api.syncWhatsappInstances();
      await load();
      onToast?.(`Sincronizadas: ${data.synced?.linked_count || 0} vinculadas, ${data.synced?.unlinked_count || 0} nao vinculadas`, "ok");
    } catch (err) {
      onToast?.(err.message, "err");
    } finally {
      setSyncing(false);
    }
  };

  const createTestInstance = async () => {
    const confirmed = window.confirm("Criar ou sincronizar a instancia teste replymesh_teste_local na Evolution Go? A instancia Lanche nao sera alterada.");
    if (!confirmed) return;

    setCreatingTest(true);
    try {
      const data = await api.createWhatsappTestInstance();
      await load();
      const action = data.result?.created_remote ? "criada" : "sincronizada";
      onToast?.(`Instancia teste ${action}: replymesh_teste_local`, "ok");
    } catch (err) {
      onToast?.(err.message, "err");
    } finally {
      setCreatingTest(false);
    }
  };

  return (
    <>
      <div className="kpi-row">
        <MiniStat icon="Smartphone" label="Total de instancias" value={metrics?.total_count || 0} tone="dark" />
        <MiniStat icon="Wifi" label="Conectadas" value={metrics?.connected_count || 0} tone="green" />
        <MiniStat icon="WifiOff" label="Desconectadas" value={metrics?.disconnected_count || 0} tone="red" />
        <MiniStat icon="Clock" label="Pendentes" value={metrics?.pending_count || 0} tone="amber" />
      </div>
      <div className="card">
        <div className="toolbar" style={{ border: 0, borderBottom: "1px solid var(--border)", borderRadius: 0 }}>
          <div className="muted" style={{ fontSize: 13 }}>Leitura segura: nenhuma acao cria, desconecta ou exclui instancias reais.</div>
          <div className="grow" style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-sm" onClick={sync} disabled={syncing}>
            <Icon name={syncing ? "LoaderCircle" : "RefreshCw"} size={15} className={syncing ? "spin" : ""} /> Sincronizar remotas
          </button>
          <button className="btn btn-primary btn-sm" onClick={createTestInstance} disabled={creatingTest}>
            <Icon name={creatingTest ? "LoaderCircle" : "Plus"} size={15} className={creatingTest ? "spin" : ""} /> Criar instancia teste
          </button>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Instancia</th><th>Empresa</th><th>Numero</th><th>Status</th><th>Origem</th><th>Sessao</th><th style={{ textAlign: "right" }}>Acoes</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7"><Empty icon="LoaderCircle" title="Carregando instancias" spin /></td></tr>}
              {!loading && error && <tr><td colSpan="7"><Empty icon="CircleAlert" title={error} /></td></tr>}
              {!loading && !error && instances.map((item) => {
                const status = STATUS[item.status] || ["gray", item.status];
                const isRemote = item.source === "remote";
                const isLinkedRemote = item.remote_linked && !isRemote;
                const originLabel = isRemote ? "Remota nao vinculada" : isLinkedRemote ? "Remota vinculada" : "Local";
                const originTone = isRemote ? "amber" : isLinkedRemote ? "blue" : "gray";
                return (
                  <tr key={item.id || `remote-${item.instance_name}`}>
                    <td><div className="cell-co"><CoAvatar name={item.instance_name} size={32} /><div><div className="t">{item.instance_name}</div><div className="s mono">{item.profile_name || item.provider}</div></div></div></td>
                    <td>{item.company?.name || "Evolution Go"}</td>
                    <td className="mono">{item.connected_number || "-"}</td>
                    <td><Badge tone={status[0]}>{status[1]}</Badge></td>
                    <td><Badge tone={originTone} dot={false}>{originLabel}</Badge></td>
                    <td className="muted" style={{ fontSize: 12.5 }}>{item.raw_status || formatDate(item.updated_at)}</td>
                    <td>
                      <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                        <button className="ra" title={isRemote ? "Disponivel apos vincular a uma empresa" : "QR Code pendente de token seguro"} disabled onClick={() => navigate("/whatsapp/qrcode", { state: { instanceId: item.id } })}><Icon name="QrCode" size={16} /></button>
                        <button className="ra" title={isRemote ? "Status ja veio da Evolution" : "Status"} disabled={isRemote || actionId === item.id} onClick={() => run(item, api.getWhatsappStatus, "Status atualizado")}><Icon name="Radar" size={16} /></button>
                        <button className="ra" title={isRemote ? "Acao bloqueada para leitura segura" : "Desconectar"} disabled={isRemote || actionId === item.id} onClick={() => run(item, api.disconnectWhatsappInstance, "Instancia desconectada")}><Icon name="Unplug" size={16} /></button>
                        <button className="ra" title={isRemote ? "Acao bloqueada para leitura segura" : "Reiniciar"} disabled={isRemote || actionId === item.id} onClick={() => run(item, api.restartWhatsappInstance, "Instancia reiniciada")}><Icon name="RefreshCw" size={15} /></button>
                        <button className="ra" title="Logs" onClick={() => navigate("/whatsapp/logs")}><Icon name="ScrollText" size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && !error && instances.length === 0 && <tr><td colSpan="7"><Empty icon="Smartphone" title="Nenhuma instancia cadastrada" /></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function MiniStat({ icon, label, value, tone }) {
  const map = { dark: ["#18181b", "#fff"], green: ["var(--green-bg)", "var(--green)"], red: ["var(--red-bg)", "var(--red)"], amber: ["var(--amber-bg)", "var(--amber)"] };
  const [bg, fg] = map[tone] || map.dark;
  return (
    <div className="card stat">
      <div className="top">
        <div className="si" style={{ background: bg, color: fg }}><Icon name={icon} size={18} /></div>
        <div className="lab">{label}</div>
      </div>
      <div className="val">{value}</div>
    </div>
  );
}

function WAQrCode({ onToast }) {
  const [companies, setCompanies] = useState([]);
  const [instances, setInstances] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [instanceName, setInstanceName] = useState("replymesh_teste_local");
  const [selectedId, setSelectedId] = useState("");
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const selectedInstance = instances.find((instance) => String(instance.id) === String(selectedId)) || null;

  useEffect(() => {
    let active = true;
    Promise.all([api.getCompanies(), api.getWhatsappInstances()])
      .then(([companiesData, instancesData]) => {
        if (!active) return;
        const eligible = (instancesData.instances || []).filter((instance) => instance.id && instance.instance_name.startsWith("replymesh_teste"));
        setCompanies(companiesData.companies || []);
        setInstances(eligible);
        setCompanyId(String(companiesData.companies?.[0]?.id || ""));
        setSelectedId(String(eligible[0]?.id || ""));
      })
      .catch((err) => onToast?.(err.message, "err"))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onToast]);

  const createInstance = async () => {
    if (!companyId || !instanceName.trim()) {
      onToast?.("Informe empresa e nome da instancia", "err");
      return;
    }
    setCreating(true);
    try {
      const data = await api.createWhatsappInstance({ whatsapp_instance: { company_id: companyId, instance_name: instanceName.trim() } });
      const refreshed = await api.getWhatsappInstances();
      setInstances(refreshed.instances || []);
      setSelectedId(String(data.instance.id));
      onToast?.("Instancia criada com sucesso", "ok");
    } catch (err) {
      onToast?.(err.message, "err");
    } finally {
      setCreating(false);
    }
  };

  const loadQr = async () => {
    if (!selectedId) return;
    setCreating(true);
    try {
      const data = await api.getWhatsappQrCode(selectedId);
      setQrCode(data.qrcode || null);
      if (data.instance) {
        setInstances((current) => current.map((instance) => instance.id === data.instance.id ? { ...instance, ...data.instance } : instance));
      }
      onToast?.("QR Code gerado", "ok");
    } catch (err) {
      onToast?.(err.message, "err");
    } finally {
      setCreating(false);
    }
  };

  const refreshStatus = async () => {
    if (!selectedId) return;
    setStatusLoading(true);
    try {
      await api.getWhatsappStatus(selectedId);
      const refreshed = await api.getWhatsappInstances();
      setInstances((refreshed.instances || []).filter((instance) => instance.id && instance.instance_name.startsWith("replymesh_teste")));
      onToast?.("Status atualizado", "ok");
    } catch (err) {
      onToast?.(err.message, "err");
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="grid-2">
      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 420, gap: 22 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Conectar WhatsApp</div>
          <div className="muted" style={{ marginTop: 5, maxWidth: 360 }}>Selecione a instancia teste e gere o QR Code pelo backend Rails.</div>
        </div>
        <div className="qr-box" style={{ position: "relative", overflow: "hidden" }}>
          {qrCode?.type === "base64" && qrCode.value ? <img src={qrCode.value} alt="QR Code WhatsApp" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <Icon name="QrCode" size={92} className="muted" />}
        </div>
        {qrCode?.type === "text" && qrCode.value && <div className="mono" style={{ fontSize: 12, maxWidth: 360, overflowWrap: "anywhere", textAlign: "center" }}>{qrCode.value}</div>}
        <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={loadQr} disabled={creating || !selectedId}>
          {creating ? <><Icon name="LoaderCircle" size={16} className="spin" /> Processando...</> : <><Icon name="QrCode" size={16} /> Gerar QR Code</>}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={refreshStatus} disabled={statusLoading || !selectedId}>
          {statusLoading ? <><Icon name="LoaderCircle" size={16} className="spin" /> Atualizando...</> : <><Icon name="Radar" size={16} /> Atualizar status</>}
        </button>
        </div>
      </div>

      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div className="form-section-t">Instancia</div>
          <div className="form-section-s">Apenas instancias de teste sao elegiveis para QR</div>
        </div>
        <div className="field">
          <label>Empresa</label>
          <select value={companyId} onChange={(event) => setCompanyId(event.target.value)} disabled={loading}>
            <option value="">Selecione</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Nome da instancia</label>
          <input value={instanceName} onChange={(event) => setInstanceName(event.target.value)} />
        </div>
        <button className="btn btn-ghost" onClick={createInstance} disabled><Icon name="Plus" size={15} /> Criar instancia teste</button>
        <div className="muted" style={{ fontSize: 12.5 }}>Criacao continua pela aba Instancias. QR Code usa somente o token local da instancia teste.</div>
        <div className="divider" />
        <div className="field">
          <label>Instancia elegivel</label>
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            <option value="">Selecione</option>
            {instances.map((instance) => <option key={instance.id} value={instance.id}>{instance.instance_name} - {instance.company.name}</option>)}
          </select>
        </div>
        <div className="card" style={{ padding: 14, boxShadow: "none" }}>
          <div className="muted" style={{ fontSize: 12 }}>Status atual</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            <Badge tone={(STATUS[selectedInstance?.status] || ["gray"])[0]}>{(STATUS[selectedInstance?.status] || ["gray", "Sem instancia"])[1]}</Badge>
            <span className="mono muted" style={{ fontSize: 12 }}>{selectedInstance?.raw_status || selectedInstance?.remote_status || "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WATemplates({ onToast }) {
  const [templates, setTemplates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([api.getWhatsappTemplates(), api.getCompanies()])
      .then(([templatesData, companiesData]) => {
        if (!active) return;
        setTemplates(templatesData.templates || []);
        setCompanies(companiesData.companies || []);
      })
      .catch((err) => onToast?.(err.message, "err"))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onToast]);

  const save = async () => {
    try {
      const payload = { whatsapp_template: editing };
      const data = editing.id ? await api.updateWhatsappTemplate(editing.id, payload) : await api.createWhatsappTemplate(payload);
      setTemplates((current) => editing.id ? current.map((item) => item.id === editing.id ? data.template : item) : [data.template, ...current]);
      setEditing(null);
      onToast?.("Template salvo com sucesso", "ok");
    } catch (err) {
      onToast?.(err.message, "err");
    }
  };

  return (
    <>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="muted" style={{ fontSize: 13.5 }}>{templates.length} templates vinculados a empresas</div>
        <div className="grow" style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing({ company_id: companies[0]?.id || "", template_key: "", title: "", message: "", enabled: true })}><Icon name="Plus" size={15} /> Novo template</button>
      </div>
      {editing && (
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="form-grid">
            <div className="field"><label>Empresa</label><select value={editing.company_id} onChange={(event) => setEditing({ ...editing, company_id: event.target.value })}>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></div>
            <div className="field"><label>Chave</label><input value={editing.template_key} onChange={(event) => setEditing({ ...editing, template_key: event.target.value })} /></div>
            <div className="field"><label>Titulo</label><input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></div>
            <div className="field"><label>Status</label><select value={editing.enabled ? "true" : "false"} onChange={(event) => setEditing({ ...editing, enabled: event.target.value === "true" })}><option value="true">Ativo</option><option value="false">Inativo</option></select></div>
            <div className="field full"><label>Mensagem</label><textarea value={editing.message} onChange={(event) => setEditing({ ...editing, message: event.target.value })} /></div>
          </div>
          <button className="btn btn-primary" onClick={save}><Icon name="Save" size={16} /> Salvar template</button>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 16 }}>
        {loading && <div className="card card-pad"><Empty icon="LoaderCircle" title="Carregando templates" spin /></div>}
        {!loading && templates.map((template) => (
          <div key={template.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 18px 0", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 650, fontSize: 14.5 }}>{template.title}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <Badge tone="blue" dot={false}>{template.company.name}</Badge>
                  <Badge tone={template.enabled ? "green" : "gray"}>{template.enabled ? "Ativo" : "Inativo"}</Badge>
                </div>
              </div>
              <button className="ra" onClick={() => setEditing({ ...template, company_id: template.company.id })}><Icon name="Pencil" size={16} /></button>
            </div>
            <div style={{ margin: "14px 18px", padding: 14, background: "#f7f7f8", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, color: "var(--text-2)", lineHeight: 1.55, flex: 1 }}>
              {template.message}
            </div>
            <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
              <span className="muted mono">{template.template_key}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function WALogs({ onToast }) {
  const [level, setLevel] = useState("all");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const labels = { all: "Todos", ok: "Sucesso", info: "Info", warn: "Avisos", err: "Erros" };

  useEffect(() => {
    let active = true;
    const params = level === "all" ? {} : { level };
    api.getWhatsappLogs(params)
      .then((data) => {
        if (active) setLogs(data.logs || []);
      })
      .catch((err) => onToast?.(err.message, "err"))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [level, onToast]);

  return (
    <>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <div className="tabs">
          {Object.entries(labels).map(([key, label]) => (
            <button key={key} className={`tab${level === key ? " active" : ""}`} onClick={() => { setLoading(true); setLevel(key); }}>{label}</button>
          ))}
        </div>
        <div className="grow" style={{ flex: 1 }} />
        <div className="muted" style={{ fontSize: 13 }}>{NUM(logs.length)} registros</div>
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ background: "#fcfcfd", borderBottom: "1px solid var(--border)", padding: "10px 16px", fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "flex", gap: 14 }}>
          <span style={{ flex: "0 0 120px" }}>Horario</span><span style={{ flex: "0 0 64px" }}>Nivel</span><span style={{ flex: "0 0 180px" }}>Empresa</span><span>Mensagem</span>
        </div>
        {loading && <Empty icon="LoaderCircle" title="Carregando logs" spin />}
        {!loading && logs.map((log) => {
          const levelInfo = LOG_LEVEL[log.level] || ["gray", log.level];
          return (
            <div className="code-line" key={log.id}>
              <span className="ts" style={{ flex: "0 0 120px" }}>{formatDate(log.created_at)}</span>
              <span className={`lv ${log.level}`} style={{ flex: "0 0 64px" }}>{levelInfo[1]}</span>
              <span style={{ flex: "0 0 180px", color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}>{log.company.name}</span>
              <span className="msg">{log.message}</span>
            </div>
          );
        })}
        {!loading && logs.length === 0 && <Empty icon="ScrollText" title="Nenhum log encontrado" />}
      </div>
    </>
  );
}

function Empty({ icon, title, spin = false }) {
  return (
    <div className="empty">
      <div className="ei"><Icon name={icon} size={24} className={spin ? "spin" : ""} /></div>
      <div className="et">{title}</div>
    </div>
  );
}
