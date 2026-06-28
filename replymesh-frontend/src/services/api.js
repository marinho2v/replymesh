const API_URL = (import.meta.env.VITE_API_URL || "https://api.replymesh.cloud/api/v1")
  .replace("://localhost", "://127.0.0.1");
const TOKEN_KEY = "replymesh_token";
const USER_KEY = "replymesh_user";

export class ApiError extends Error {
  constructor(message, { status = null, data = null, connection = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.connection = connection;
  }
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isSuperAdmin(user) {
  return user?.global_role === "super_admin";
}

export function isMasterUser(user) {
  return isSuperAdmin(user) || Boolean(user?.master_role || user?.master_role_id);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    const user = JSON.parse(raw);
    if (!isMasterUser(user)) {
      clearSession();
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function saveSession({ token, user }) {
  if (!isMasterUser(user)) {
    clearSession();
    throw new ApiError("Acesso restrito ao painel Master.", {
      status: 403,
      data: { error: "master_forbidden" },
    });
  }

  localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const token = getAuthToken();
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new ApiError("Nao foi possivel conectar ao backend Rails.", { connection: true });
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearSession();
    window.dispatchEvent(new CustomEvent("replymesh:unauthorized"));
    throw new ApiError(
      data.message || data.error || "Sessao expirada. Faca login novamente.",
      { status: response.status, data },
    );
  }

  if (response.status === 403 && data?.error === "master_forbidden") {
    if (!getStoredUser()) {
      clearSession();
      window.dispatchEvent(new CustomEvent("replymesh:unauthorized"));
    }

    throw new ApiError(
      data.message || data.error || "Voce nao tem permissao para esta area.",
      { status: response.status, data },
    );
  }

  if (!response.ok) {
    throw new ApiError(data.error || data.errors?.join(", ") || "Erro na API.", { status: response.status, data });
  }

  return data;
}

export const api = {
  getFounderProgramStatus: () => request("/public/founder_program"),
  checkFounderSlug: (slug, companyName = "") => {
    const query = new URLSearchParams({ slug, company_name: companyName }).toString();
    return request(`/public/founder_signups/slug?${query}`);
  },
  startFounderSignup: (signup) => request("/public/founder_signups", { method: "POST", body: JSON.stringify({ signup }) }),
  verifyFounderSignup: (signupId, code) => request("/public/founder_signups/verify", {
    method: "POST",
    body: JSON.stringify({ signup_id: signupId, code }),
  }),
  resendFounderSignup: (signupId) => request("/public/founder_signups/resend", {
    method: "POST",
    body: JSON.stringify({ signup_id: signupId }),
  }),
  logout: () => request("/auth/logout", { method: "DELETE" }),
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request("/auth/me"),
  getDashboard: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/master/dashboard${query ? `?${query}` : ""}`);
  },
  getFounderProgram: () => request("/master/founder_program"),
  updateFounderProgram: (founderProgram) => request("/master/founder_program", {
    method: "PATCH",
    body: JSON.stringify({ founder_program: founderProgram }),
  }),
  getSmtpSettings: () => request("/master/smtp_settings"),
  updateSmtpSettings: (smtpSettings) => request("/master/smtp_settings", {
    method: "PATCH",
    body: JSON.stringify({ smtp_settings: smtpSettings }),
  }),
  testSmtpSettings: (recipient) => request("/master/smtp_settings/test", {
    method: "POST",
    body: JSON.stringify({ recipient }),
  }),
  getCompanies: () => request("/master/companies"),
  getCompany: (id) => request(`/master/companies/${id}`),
  createCompany: (payload) => request("/master/companies", { method: "POST", body: JSON.stringify(payload) }),
  updateCompany: (id, payload) => request(`/master/companies/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  getMasterCompanyStoreSettings: (id) => request(`/master/companies/${id}/store_settings`),
  updateMasterCompanyStoreSettings: (id, payload) => request(`/master/companies/${id}/store_settings`, { method: "PATCH", body: JSON.stringify(payload) }),
  getMasterCompanyStoreAiSettings: (id) => request(`/master/companies/${id}/store_ai_settings`),
  updateMasterCompanyStoreAiSettings: (id, payload) => request(`/master/companies/${id}/store_ai_settings`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateCompanyAdminPassword: (id, payload) => request(`/master/companies/${id}/admin_password`, { method: "PATCH", body: JSON.stringify(payload) }),
  activateCompany: (id) => request(`/master/companies/${id}/activate`, { method: "PATCH" }),
  deactivateCompany: (id) => request(`/master/companies/${id}/deactivate`, { method: "PATCH" }),
  impersonateCompany: (id) => request(`/master/companies/${id}/impersonate`, { method: "POST" }),
  getCompanyFeatures: (id) => request(`/master/companies/${id}/features`),
  updateCompanyFeatures: (id, overrides) => request(`/master/companies/${id}/features`, { method: "PATCH", body: JSON.stringify({ overrides }) }),
  updateCompanyModules: (id, payload) => request(`/master/companies/${id}/features`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateCompanyPlan: (id, payload) => request(`/master/companies/${id}/plan`, { method: "PATCH", body: JSON.stringify(payload) }),
  dryRunCompanyBackupImport: (id, backup) => request(`/master/companies/${id}/backup_import/dry_run`, {
    method: "POST",
    body: JSON.stringify({ backup }),
  }),
  importCompanyBackup: (id, backup) => request(`/master/companies/${id}/backup_import`, {
    method: "POST",
    body: JSON.stringify({ backup }),
  }),
  revokeImpersonation: (sessionToken) => request(`/master/impersonation/${encodeURIComponent(sessionToken)}`, { method: "DELETE" }),
  getCompanySettings: (companyId) => {
    const query = companyId ? `?company_id=${encodeURIComponent(companyId)}` : "";
    return request(`/company/settings${query}`);
  },
  updateCompanySettings: (payload) => request("/company/settings", { method: "PUT", body: JSON.stringify(payload) }),
  getPlans: () => request("/master/plans"),
  createPlan: (payload) => request("/master/plans", { method: "POST", body: JSON.stringify(payload) }),
  updatePlan: (id, payload) => request(`/master/plans/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  getSubscriptions: () => request("/master/subscriptions"),
  updateSubscription: (id, payload) => request(`/master/subscriptions/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  getDomains: () => request("/master/domains"),
  createDomain: (payload) => request("/master/domains", { method: "POST", body: JSON.stringify(payload) }),
  updateDomain: (id, payload) => request(`/master/domains/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deactivateDomain: (id) => request(`/master/domains/${id}`, { method: "DELETE" }),
  verifyDomain: (id) => request(`/master/domains/${id}/verify`),
  setPrimaryDomain: (id) => request(`/master/domains/${id}/set_primary`, { method: "PATCH" }),
  testWhatsappConnection: () => request("/master/whatsapp/settings/test_connection"),
  getWhatsappInstances: () => request("/master/whatsapp/instances"),
  syncWhatsappInstances: () => request("/master/whatsapp/instances/sync", { method: "POST" }),
  createWhatsappTestInstance: () => request("/master/whatsapp/instances/create_test", { method: "POST" }),
  createWhatsappInstance: (payload) => request("/master/whatsapp/instances", { method: "POST", body: JSON.stringify(payload) }),
  getWhatsappStatus: (id) => request(`/master/whatsapp/instances/${id}/status`),
  getWhatsappQrCode: (id) => request(`/master/whatsapp/instances/${id}/qrcode`),
  disconnectWhatsappInstance: (id) => request(`/master/whatsapp/instances/${id}/disconnect`, { method: "POST" }),
  restartWhatsappInstance: (id) => request(`/master/whatsapp/instances/${id}/restart`, { method: "POST" }),
  deleteWhatsappInstance: (id) => request(`/master/whatsapp/instances/${id}`, { method: "DELETE" }),
  getWhatsappTemplates: () => request("/master/whatsapp/templates"),
  createWhatsappTemplate: (payload) => request("/master/whatsapp/templates", { method: "POST", body: JSON.stringify(payload) }),
  updateWhatsappTemplate: (id, payload) => request(`/master/whatsapp/templates/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  getWhatsappLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/master/whatsapp/logs${query ? `?${query}` : ""}`);
  },
  getActivityLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/master/activity_logs${query ? `?${query}` : ""}`);
  },
  getMasterAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/master/audit_logs${query ? `?${query}` : ""}`);
  },
  getSystemAlerts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/master/system_alerts${query ? `?${query}` : ""}`);
  },
  resolveSystemAlert: (id) => request(`/master/system_alerts/${id}/resolve`, { method: "PATCH" }),
  getTickets: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/master/tickets${query ? `?${query}` : ""}`);
  },
  getTicket: (id) => request(`/master/tickets/${id}`),
  replyTicket: (id, payload) => request(`/master/tickets/${id}/messages`, { method: "POST", body: JSON.stringify(payload) }),
  updateTicketStatus: (id, status) => request(`/master/tickets/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  getAiSettings: () => request("/master/ai/settings"),
  updateAiSettings: (payload) => request("/master/ai/settings", { method: "PATCH", body: JSON.stringify({ settings: payload }) }),
  testAiConnection: (message) => request("/master/ai/test", { method: "POST", body: JSON.stringify({ message }) }),
  testAiProvider: (provider, message) => request("/master/ai/test", { method: "POST", body: JSON.stringify({ scope: "store_ai", provider, message }) }),
  testStoreAiConnection: (message) => request("/master/ai/test", { method: "POST", body: JSON.stringify({ scope: "store_ai", message }) }),
  getAiUsage: () => request("/master/ai/usage"),
  getAndroidApps: () => request("/master/android_apps"),
  getAndroidApp: (id) => request(`/master/android_apps/${id}`),
  updateAndroidApp: (id, payload) => request(`/master/android_apps/${id}`, { method: "PATCH", body: JSON.stringify({ android_app: payload }) }),
  updateAndroidAppStatus: (id, status) => request(`/master/android_apps/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  getSystemUpdates: () => request("/master/system_updates"),
  createSystemUpdate: (payload) => request("/master/system_updates", { method: "POST", body: JSON.stringify({ system_update: payload }) }),
  updateSystemUpdate: (id, payload) => request(`/master/system_updates/${id}`, { method: "PATCH", body: JSON.stringify({ system_update: payload }) }),
  deleteSystemUpdate: (id) => request(`/master/system_updates/${id}`, { method: "DELETE" }),
  publishSystemUpdate: (id) => request(`/master/system_updates/${id}/publish`, { method: "PATCH" }),
  unpublishSystemUpdate: (id) => request(`/master/system_updates/${id}/unpublish`, { method: "PATCH" }),
  getMasterNotifications: () => request("/master/notifications"),
  readMasterNotification: (id) => request(`/master/notifications/${id}/read`, { method: "PATCH" }),
  readAllMasterNotifications: () => request("/master/notifications/read_all", { method: "PATCH" }),
  getMasterUsers: () => request("/master/users"),
  createMasterUser: (payload) => request("/master/users", { method: "POST", body: JSON.stringify({ user: payload }) }),
  updateMasterUser: (id, payload) => request(`/master/users/${id}`, { method: "PATCH", body: JSON.stringify({ user: payload }) }),
  updateMasterUserStatus: (id, status) => request(`/master/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  resetMasterUserPassword: (id, password) => request(`/master/users/${id}/reset_password`, { method: "PATCH", body: JSON.stringify({ password }) }),
  removeMasterUser: (id) => request(`/master/users/${id}`, { method: "DELETE" }),
  getMasterRoles: () => request("/master/roles"),
  createMasterRole: (payload) => request("/master/roles", { method: "POST", body: JSON.stringify({ role: payload }) }),
  updateMasterRole: (id, payload) => request(`/master/roles/${id}`, { method: "PATCH", body: JSON.stringify({ role: payload }) }),
  getMasterInvites: () => request("/master/invites"),
  createMasterInvite: (payload) => request("/master/invites", { method: "POST", body: JSON.stringify({ invite: payload }) }),
  cancelMasterInvite: (id) => request(`/master/invites/${id}/cancel`, { method: "PATCH" }),
  resendMasterInvite: (id) => request(`/master/invites/${id}/resend`, { method: "PATCH" }),
  getMasterProfile: () => request("/master/profile"),
  updateMasterProfile: (payload) => request("/master/profile", { method: "PATCH", body: JSON.stringify({ profile: payload }) }),
  updateMasterPassword: (payload) => request("/master/profile/password", { method: "PATCH", body: JSON.stringify(payload) }),
  getMasterBranding: () => request("/master/branding"),
  updateMasterBranding: (payload) => request("/master/branding", { method: "PATCH", body: JSON.stringify({ branding: payload }) }),
  getPublicPlatformBranding: () => request("/public/platform"),

  // Financeiro
  getFinanceiro:              ()  => request("/master/financeiro"),
  getFinanceiroCobrancas:     ()  => request("/master/financeiro/cobrancas"),
  getFinanceiroInadimplencia: ()  => request("/master/financeiro/inadimplencia"),
};

export { API_URL, TOKEN_KEY, USER_KEY };
