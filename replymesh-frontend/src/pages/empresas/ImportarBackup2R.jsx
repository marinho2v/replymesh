import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CoAvatar } from "../../components/ui/CoAvatar.jsx";
import { Icon } from "../../components/ui/Icon.jsx";
import { api } from "../../services/api.js";

const IMPORTANT_KEYS = [
  ["categories", "Categorias"],
  ["products", "Produtos"],
  ["product_option_groups", "Grupos de opcionais"],
  ["product_option_items", "Opcionais/adicionais"],
  ["product_images", "Imagens de produtos"],
  ["app_banners", "Banners do app"],
  ["delivery_zones", "Áreas de entrega"],
  ["business_hours", "Horários"],
  ["customers", "Clientes"],
  ["customer_addresses", "Endereços"],
  ["orders", "Pedidos"],
  ["order_items", "Itens dos pedidos"],
  ["order_status_history", "Histórico de status"],
  ["motoboys", "Motoboys"],
  ["deliveries", "Entregas"],
  ["coupons", "Cupons"],
  ["wheel_prizes", "Prêmios da roleta"],
  ["wheel_spins", "Giros da roleta"],
  ["inventory_items", "Estoque"],
  ["cash_sessions", "Sessões de caixa"],
  ["cash_movements", "Movimentações de caixa"],
  ["dining_tables", "Mesas"],
];

const IMPORTED_LABELS = {
  store: "Configurações da loja",
  categories: "Categorias",
  products: "Produtos",
  product_option_groups: "Grupos de opcionais",
  product_option_items: "Opcionais/adicionais",
  app_banners: "Banners do app",
  delivery_zones: "Áreas de entrega",
  business_hours: "Horários",
  customers: "Clientes",
  customer_addresses: "Endereços",
  motoboys: "Motoboys",
  coupons: "Cupons",
  wheel_prizes: "Prêmios da roleta",
  inventory_items: "Estoque",
  dining_tables: "Mesas",
};

export function ImportarBackup2R({ onToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fileName, setFileName] = useState("");
  const [backup, setBackup] = useState(null);
  const [dryRun, setDryRun] = useState(null);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api.getCompany(id)
      .then((data) => {
        if (!alive) return;
        setCompany(data.company);
      })
      .catch((err) => onToast?.(err.message, "err"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id, onToast]);

  const totals = useMemo(() => {
    if (!backup) return [];
    return IMPORTANT_KEYS.map(([key, label]) => ({
      key,
      label,
      count: Array.isArray(backup[key]) ? backup[key].length : 0,
    }));
  }, [backup]);

  const imageSummary = useMemo(() => {
    if (!backup) return { full: 0, relative: 0, empty: 0 };
    const urls = [
      ...(backup.products || []).map((item) => item.image_url),
      ...(backup.product_images || []).map((item) => item.url || item.image_url),
      ...(backup.app_banners || []).map((item) => item.imagem || item.image_url || item.url),
    ].filter((value) => value !== undefined);

    return urls.reduce((acc, value) => {
      const text = String(value || "");
      if (!text) acc.empty += 1;
      else if (/^https?:\/\//i.test(text)) acc.full += 1;
      else acc.relative += 1;
      return acc;
    }, { full: 0, relative: 0, empty: 0 });
  }, [backup]);

  const readFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setBackup(null);
    setDryRun(null);
    setImportResult(null);
    setError("");

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setBackup(parsed);
      onToast?.("Backup lido com sucesso. Conferindo no Rails...", "ok");
      await runDryRun(parsed);
    } catch (err) {
      setError(err.message || "Arquivo inválido");
      onToast?.("Não foi possível ler o backup", "err");
    }
  };

  const runDryRun = async (payload = backup) => {
    if (!payload) return;
    setChecking(true);
    setError("");
    setDryRun(null);
    try {
      const data = await api.dryRunCompanyBackupImport(id, payload);
      setDryRun(data);
      onToast?.("Backup conferido pelo Rails. Importação liberada.", "ok");
    } catch (err) {
      setError(err.message || "Falha na conferência do backup");
      onToast?.(err.message || "Falha na conferência do backup", "err");
    } finally {
      setChecking(false);
    }
  };

  const runImport = async () => {
    if (!backup || importing) return;
    const ok = window.confirm(
      `Importar este backup para "${company?.name || "esta empresa"}"?\n\n` +
      "Produtos, categorias, clientes, cupons, roleta, estoque, mesas e configurações serão criados/atualizados.\n" +
      "Pedidos históricos e caixa serão mantidos apenas como conferência nesta etapa."
    );
    if (!ok) return;

    setImporting(true);
    setError("");
    try {
      const data = await api.importCompanyBackup(id, backup);
      setImportResult(data);
      setDryRun(data);
      onToast?.("Backup importado com sucesso.", "ok");
    } catch (err) {
      setError(err.message || "Falha ao importar backup");
      onToast?.(err.message || "Falha ao importar backup", "err");
    } finally {
      setImporting(false);
    }
  };

  const importRows = useMemo(() => {
    const source = importResult || dryRun;
    if (!source) return [];
    const keys = Object.keys(IMPORTED_LABELS);
    return keys.map((key) => ({
      key,
      label: IMPORTED_LABELS[key],
      found: source.importable_counts?.[key] || 0,
      imported: source.imported?.[key] || 0,
      updated: source.updated?.[key] || 0,
      skipped: source.skipped?.[key] || 0,
    }));
  }, [dryRun, importResult]);

  if (loading) {
    return <div className="page"><div className="empty"><Icon name="LoaderCircle" className="spin" /> Carregando empresa...</div></div>;
  }

  return (
    <div className="page fade-up">
      <div className="page-head">
        <div>
          <button className="link" style={{ paddingLeft: 0, marginBottom: 6 }} onClick={() => navigate("/empresas")}>
            <Icon name="ArrowLeft" size={15} /> Empresas
          </button>
          <div className="pt">Importar backup</div>
          <div className="ps">Selecione o JSON exportado, confira no Rails e importe para a empresa atual.</div>
        </div>
      </div>

      {company && (
        <section className="company-detail-hero card">
          <CoAvatar name={company.name} size={58} radius={13} />
          <div className="company-detail-main">
            <h2>{company.name}</h2>
            <p>{company.primary_domain || `${company.slug}.replymesh.cloud`}</p>
          </div>
        </section>
      )}

      <div className="grid two">
        <section className="card card-pad">
          <div className="form-section-t">1. Selecionar arquivo</div>
          <p className="muted">Use o arquivo JSON gerado pelo exportador, exemplo: <strong>backup-2026-06-07T16-00.json</strong>.</p>
          <div className="field" style={{ marginTop: 16 }}>
            <label>Arquivo JSON do backup</label>
            <input type="file" accept="application/json,.json" onChange={readFile} />
          </div>
          {fileName && <p className="muted" style={{ marginTop: 10 }}>Arquivo selecionado: <strong>{fileName}</strong></p>}
          {error && <div className="notice danger" style={{ marginTop: 14 }}>{error}</div>}
        </section>

        <section className="card card-pad">
          <div className="form-section-t">2. Conferência segura</div>
          <div className="company-info-row"><span>Modo atual</span><strong>{dryRun ? "Conferido no Rails" : "Aguardando arquivo"}</strong></div>
          <div className="company-info-row"><span>Importação real</span><strong>{dryRun ? "Liberada" : "Bloqueada até conferir"}</strong></div>
          <div className="company-info-row"><span>Alvo</span><strong>{company?.name || "-"}</strong></div>
          <p className="muted" style={{ marginTop: 14 }}>
            A importação é idempotente: ao repetir, o sistema atualiza itens já importados em vez de duplicar.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <button className="btn btn-ghost" disabled={!backup || checking || importing} onClick={() => runDryRun()}>
              <Icon name={checking ? "LoaderCircle" : "RefreshCcw"} size={16} className={checking ? "spin" : ""} /> Conferir no Rails
            </button>
            <button className="btn btn-primary" disabled={!dryRun || checking || importing} onClick={runImport}>
              <Icon name={importing ? "LoaderCircle" : "Archive"} size={16} className={importing ? "spin" : ""} /> Importar backup
            </button>
          </div>
        </section>
      </div>

      {backup && (
        <>
          <section className="card card-pad" style={{ marginTop: 18 }}>
            <div className="card-head">
              <div>
                <div className="ct">Resumo do backup</div>
                <div className="muted">Origem: {backup.export_info?.source || "Exportador"} - versao {backup.export_info?.version || "-"}</div>
              </div>
            </div>
            <div className="grid four" style={{ marginTop: 14 }}>
              {totals.map((item) => (
                <div className="stat-card" key={item.key}>
                  <div className="stat-label">{item.label}</div>
                  <div className="stat-value">{item.count}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card card-pad" style={{ marginTop: 18 }}>
            <div className="form-section-t">Imagens encontradas</div>
            <div className="company-info-row"><span>URLs completas</span><strong>{imageSummary.full}</strong></div>
            <div className="company-info-row"><span>Caminhos relativos</span><strong>{imageSummary.relative}</strong></div>
            <div className="company-info-row"><span>Campos vazios</span><strong>{imageSummary.empty}</strong></div>
            <p className="muted" style={{ marginTop: 14 }}>
              Caminhos relativos como /produtos/app/... vão precisar do domínio/base original ou migração dos arquivos para a VPS Replymesh.
            </p>
          </section>
        </>
      )}

      {dryRun && (
        <section className="card card-pad" style={{ marginTop: 18 }}>
          <div className="card-head">
            <div>
              <div className="ct">{importResult ? "Resultado da importação" : "Plano de importação"}</div>
              <div className="muted">Pedidos, caixa e histórico aparecem para conferência, mas não são importados nesta primeira etapa segura.</div>
            </div>
          </div>
          <div className="tbl-wrap" style={{ marginTop: 12 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Encontrados</th>
                  <th>Criados</th>
                  <th>Atualizados</th>
                  <th>Ignorados</th>
                </tr>
              </thead>
              <tbody>
                {importRows.map((row) => (
                  <tr key={row.key}>
                    <td><strong>{row.label}</strong></td>
                    <td className="mono">{row.found}</td>
                    <td className="mono">{row.imported}</td>
                    <td className="mono">{row.updated}</td>
                    <td className="mono">{row.skipped}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dryRun.warnings?.length > 0 && (
            <div className="notice warn" style={{ marginTop: 14 }}>
              {dryRun.warnings.map((warning) => <div key={warning}>{warning}</div>)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
