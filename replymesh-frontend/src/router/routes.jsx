/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { RequireAuth } from "../components/auth/RequireAuth.jsx";

const Login = lazy(() => import("../pages/Login.jsx").then((module) => ({ default: module.Login })));
const Dashboard = lazy(() => import("../pages/Dashboard.jsx").then((module) => ({ default: module.Dashboard })));
const EmpresasList = lazy(() => import("../pages/empresas/EmpresasList.jsx").then((module) => ({ default: module.EmpresasList })));
const NovaEmpresa = lazy(() => import("../pages/empresas/NovaEmpresa.jsx").then((module) => ({ default: module.NovaEmpresa })));
const EmpresaDetalhe = lazy(() => import("../pages/empresas/EmpresaDetalhe.jsx").then((module) => ({ default: module.EmpresaDetalhe })));
const CompanyImpersonationLaunch = lazy(() => import("../pages/empresas/CompanyImpersonationLaunch.jsx").then((module) => ({ default: module.CompanyImpersonationLaunch })));
const ImportarBackup2R = lazy(() => import("../pages/empresas/ImportarBackup2R.jsx").then((module) => ({ default: module.ImportarBackup2R })));
const WhatsApp = lazy(() => import("../pages/whatsapp/WhatsApp.jsx").then((module) => ({ default: module.WhatsApp })));
const Dominios = lazy(() => import("../pages/dominios/Dominios.jsx").then((module) => ({ default: module.Dominios })));
const Assinaturas = lazy(() => import("../pages/assinaturas/Assinaturas.jsx").then((module) => ({ default: module.Assinaturas })));
const Planos = lazy(() => import("../pages/assinaturas/Planos.jsx").then((module) => ({ default: module.Planos })));
const Financeiro = lazy(() => import("../pages/financeiro/Financeiro.jsx").then((module) => ({ default: module.Financeiro })));
const MasterUsers = lazy(() => import("../pages/usuarios/MasterUsers.jsx").then((module) => ({ default: module.MasterUsers })));
const MasterRoles = lazy(() => import("../pages/usuarios/MasterRoles.jsx").then((module) => ({ default: module.MasterRoles })));
const MasterInvites = lazy(() => import("../pages/usuarios/MasterInvites.jsx").then((module) => ({ default: module.MasterInvites })));
const MasterProfile = lazy(() => import("../pages/perfil/MasterProfile.jsx").then((module) => ({ default: module.MasterProfile })));
const LogsAuditoria = lazy(() => import("../pages/logs/LogsAuditoria.jsx").then((module) => ({ default: module.LogsAuditoria })));
const MasterAuditLogs = lazy(() => import("../pages/logs/MasterAuditLogs.jsx").then((module) => ({ default: module.MasterAuditLogs })));
const Tickets = lazy(() => import("../pages/tickets/Tickets.jsx").then((module) => ({ default: module.Tickets })));
const CompanySettings = lazy(() => import("../pages/configuracoes/CompanySettings.jsx").then((module) => ({ default: module.CompanySettings })));
const AiSettings = lazy(() => import("../pages/configuracoes/AiSettings.jsx").then((module) => ({ default: module.AiSettings })));
const SystemUpdates = lazy(() => import("../pages/configuracoes/SystemUpdates.jsx").then((module) => ({ default: module.SystemUpdates })));
const MasterBranding = lazy(() => import("../pages/configuracoes/MasterBranding.jsx").then((module) => ({ default: module.MasterBranding })));
const AndroidApps = lazy(() => import("../pages/AndroidApps.jsx").then((module) => ({ default: module.AndroidApps })));
const LandingPage = lazy(() => import("../pages/LandingPage.jsx").then((module) => ({ default: module.LandingPage })));

const page = (element) => (
  <Suspense fallback={<div className="route-loader" role="status">Carregando pagina...</div>}>
    {element}
  </Suspense>
);

const protectedPage = (element) => <RequireAuth>{page(element)}</RequireAuth>;

export const routes = (onToast, authHandlers = {}) => [
  { path: "/login", element: page(<Login onToast={onToast} onLogin={authHandlers.onLogin} />) },
  { path: "/", element: page(<LandingPage />) },
  { path: "/home", element: page(<LandingPage />) },
  { path: "/dashboard", element: protectedPage(<Dashboard />) },
  { path: "/empresas", element: protectedPage(<EmpresasList onToast={onToast} />) },
  { path: "/empresas/nova", element: protectedPage(<NovaEmpresa onToast={onToast} />) },
  { path: "/empresas/:id", element: protectedPage(<EmpresaDetalhe onToast={onToast} />) },
  { path: "/empresas/:id/editar", element: protectedPage(<EmpresaDetalhe edit onToast={onToast} />) },
  { path: "/empresas/:id/acesso", element: protectedPage(<CompanyImpersonationLaunch />) },
  { path: "/empresas/:id/importar-backup-2r", element: protectedPage(<ImportarBackup2R onToast={onToast} />) },
  { path: "/whatsapp", element: protectedPage(<WhatsApp onToast={onToast} />) },
  { path: "/whatsapp/:tab", element: protectedPage(<WhatsApp onToast={onToast} />) },
  { path: "/dominios", element: protectedPage(<Dominios onToast={onToast} />) },
  { path: "/dominios/dns", element: protectedPage(<Dominios onToast={onToast} />) },
  { path: "/dominios/ssl", element: protectedPage(<Dominios onToast={onToast} />) },
  { path: "/assinaturas", element: protectedPage(<Assinaturas onToast={onToast} />) },
  { path: "/assinaturas/faturas", element: protectedPage(<Assinaturas onToast={onToast} />) },
  { path: "/assinaturas/inadimplencia", element: protectedPage(<Assinaturas onToast={onToast} />) },
  { path: "/assinaturas/planos", element: protectedPage(<Planos onToast={onToast} />) },
  { path: "/financeiro",               element: protectedPage(<Financeiro onToast={onToast} />) },
  { path: "/financeiro/cobrancas",     element: protectedPage(<Financeiro onToast={onToast} />) },
  { path: "/financeiro/inadimplencia", element: protectedPage(<Financeiro onToast={onToast} />) },
  { path: "/usuarios-master", element: protectedPage(<MasterUsers onToast={onToast} />) },
  { path: "/usuarios-master/funcoes", element: protectedPage(<MasterRoles onToast={onToast} />) },
  { path: "/usuarios-master/convites", element: protectedPage(<MasterInvites onToast={onToast} />) },
  { path: "/perfil", element: protectedPage(<MasterProfile onToast={onToast} />) },
  { path: "/logs", element: protectedPage(<LogsAuditoria onToast={onToast} />) },
  { path: "/logs/auditoria", element: protectedPage(<MasterAuditLogs onToast={onToast} />) },
  { path: "/logs/:tab", element: protectedPage(<LogsAuditoria onToast={onToast} />) },
  { path: "/tickets", element: protectedPage(<Tickets onToast={onToast} />) },
  { path: "/tickets/:tab", element: protectedPage(<Tickets onToast={onToast} />) },
  { path: "/configuracoes", element: protectedPage(<CompanySettings onToast={onToast} />) },
  { path: "/configuracoes/ia", element: protectedPage(<AiSettings onToast={onToast} />) },
  { path: "/configuracoes/atualizacoes", element: protectedPage(<SystemUpdates onToast={onToast} />) },
  { path: "/configuracoes/aparencia", element: protectedPage(<MasterBranding onToast={onToast} />) },
  { path: "/aplicativos-android", element: protectedPage(<AndroidApps onToast={onToast} />) },
  { path: "/configuracoes/:tab", element: protectedPage(<CompanySettings onToast={onToast} />) },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
];
