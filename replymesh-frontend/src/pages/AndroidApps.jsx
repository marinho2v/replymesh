import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "../components/ui/Badge.jsx";
import { Icon } from "../components/ui/Icon.jsx";
import { api } from "../services/api.js";

const STATUS = {
  requested: ["amber", "Solicitado"],
  under_review: ["blue", "Em analise"],
  in_development: ["blue", "Em desenvolvimento"],
  publishing: ["amber", "Publicando"],
  published: ["green", "Publicado"],
  adjustments_requested: ["red", "Ajustes solicitados"],
  update_pending: ["amber", "Atualizacao pendente"],
  updated: ["green", "Atualizado"],
};

const STATUS_OPTIONS = Object.entries(STATUS).map(([value, [, label]]) => ({ value, label }));

function fmtDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function AndroidApps({ onToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changingId, setChangingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems((await api.getAndroidApps()).android_apps || []);
    } catch (error) {
      onToast?.(error.message, "err");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => (
      `${item.company?.name || ""} ${item.company?.slug || ""} ${item.app_name || ""} ${item.display_name || ""}`
        .toLowerCase()
        .includes(needle)
    ));
  }, [items, query]);

  const stats = useMemo(() => ({
    total: items.length,
    pending: items.filter((item) => ["requested", "under_review", "adjustments_requested"].includes(item.status)).length,
    development: items.filter((item) => ["in_development", "publishing"].includes(item.status)).length,
    published: items.filter((item) => ["published", "updated"].includes(item.status)).length,
  }), [items]);

  const changeStatus = async (item, status) => {
    setChangingId(item.id);
    try {
      const response = await api.updateAndroidAppStatus(item.id, status);
      const updated = response.android_app;
      setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry));
      setSelected((current) => current?.id === item.id ? updated : current);
      onToast?.("Status do aplicativo atualizado", "ok");
    } catch (error) {
      onToast?.(error.message, "err");
    } finally {
      setChangingId(null);
    }
  };

  return (
    <div className="page fade-up android-apps-master">
      <div className="page-head">
        <div>
          <div className="pt">Aplicativos Android</div>
          <div className="ps">Acompanhe as solicitacoes de aplicativos personalizados das empresas.</div>
        </div>
        <div className="grow" />
        <button className="btn btn-primary" onClick={load} disabled={loading}>
          <Icon name="RefreshCw" size={16} className={loading ? "spin" : ""} />
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      <div className="android-stat-grid">
        <div className="card android-stat"><span>Total de solicitacoes</span><strong>{stats.total}</strong><Icon name="Smartphone" size={19} /></div>
        <div className="card android-stat amber"><span>Aguardando analise</span><strong>{stats.pending}</strong><Icon name="Clock3" size={19} /></div>
        <div className="card android-stat blue"><span>Em producao</span><strong>{stats.development}</strong><Icon name="Code2" size={19} /></div>
        <div className="card android-stat green"><span>Publicados</span><strong>{stats.published}</strong><Icon name="CircleCheck" size={19} /></div>
      </div>

      <div className="toolbar">
        <div className="field-search android-search">
          <Icon name="Search" size={16} className="si" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar empresa ou aplicativo..." />
        </div>
        <div className="grow" />
        <Badge tone="gray" dot={false}>{filtered.length} solicitacoes</Badge>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="ct">Solicitacoes das empresas</div>
            <div className="cs">Clique em visualizar para consultar imagens, cores e observacoes.</div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl android-app-table">
            <thead><tr><th>Empresa</th><th>Plano</th><th>Aplicativo</th><th>Solicitado em</th><th>Status</th><th>Responsavel</th><th style={{ textAlign: "right" }}>Acoes</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="7"><div className="empty"><Icon name="LoaderCircle" className="spin" /> Carregando solicitacoes...</div></td></tr>}
              {!loading && filtered.map((item) => {
                const badge = STATUS[item.status] || STATUS.requested;
                return <tr key={item.id}>
                  <td><div className="cell-co"><span className="avatar android-avatar"><Icon name="Building2" size={17} /></span><div><div className="t">{item.company?.name || "-"}</div><div className="s">{item.company?.slug || "-"}</div></div></div></td>
                  <td><Badge tone={item.company?.plan_status === "active" ? "green" : "gray"}>{item.company?.plan_status === "active" ? "Ativo" : item.company?.plan_status || "-"}</Badge></td>
                  <td><div className="android-app-name"><strong>{item.app_name}</strong><span>{item.display_name}</span></div></td>
                  <td>{fmtDate(item.requested_at)}</td>
                  <td><Badge tone={badge[0]}>{badge[1]}</Badge></td>
                  <td>{item.responsible?.name || "Nao atribuido"}</td>
                  <td><div className="row-actions" style={{ justifyContent: "flex-end" }}>
                    <button className="ra" title="Visualizar solicitacao" onClick={() => setSelected(item)}><Icon name="Eye" size={16} /></button>
                    <label className="android-status-action">
                      <span className="sr-only">Alterar status</span>
                      <select value={item.status} disabled={changingId === item.id} onChange={(event) => changeStatus(item, event.target.value)}>
                        {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </label>
                  </div></td>
                </tr>;
              })}
              {!loading && filtered.length === 0 && <tr><td colSpan="7"><div className="empty"><div className="ei"><Icon name="Smartphone" size={25} /></div><div className="et">Nenhuma solicitacao encontrada</div><div className="es">As solicitacoes enviadas pelas lojas aparecerao aqui.</div></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
        <div className="modal master-modal android-detail-modal">
          <div className="card-head"><div><div className="ct">{selected.app_name}</div><div className="cs">{selected.company?.name}</div></div><div className="grow" /><button className="ra" onClick={() => setSelected(null)}><Icon name="X" size={17} /></button></div>
          <div className="modal-body">
            <div className="android-detail-status"><Badge tone={(STATUS[selected.status] || STATUS.requested)[0]}>{(STATUS[selected.status] || STATUS.requested)[1]}</Badge><span>Atualizado em {fmtDate(selected.updated_at)}</span></div>
            <div className="android-detail-grid">
              <div><span>Nome exibido</span><strong>{selected.display_name || "-"}</strong></div>
              <div><span>WhatsApp de suporte</span><strong>{selected.support_whatsapp || "-"}</strong></div>
              <div><span>Cor principal</span><strong className="color-preview"><i style={{ background: selected.primary_color }} />{selected.primary_color}</strong></div>
              <div><span>Cor secundaria</span><strong className="color-preview"><i style={{ background: selected.secondary_color }} />{selected.secondary_color}</strong></div>
            </div>
            <div className="android-media-grid">
              {[["Logo", selected.logo_url], ["Icone", selected.icon_url], ["Splash", selected.splash_url]].map(([label, url]) => <div key={label}><span>{label}</span>{url ? <img src={url} alt={label} /> : <div className="android-media-empty"><Icon name="Image" size={23} />Nao enviado</div>}</div>)}
            </div>
            <div className="android-notes"><span>Observacoes</span><p>{selected.notes || "Nenhuma observacao enviada pela empresa."}</p></div>
          </div>
          <div className="modal-actions"><button className="btn btn-ghost" onClick={() => setSelected(null)}>Fechar</button></div>
        </div>
      </div>}
    </div>
  );
}
