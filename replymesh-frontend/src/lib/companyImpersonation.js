export function companyImpersonationUrl(data) {
  const slug = data.company_slug || "";
  const payload = new URLSearchParams({
    token: data.token,
    session_token: data.session_token,
    company_id: String(data.company_id),
    company_slug: slug,
    company_name: data.company?.name || "",
    master_name: data.user?.name || "Suporte Replymesh",
    user: JSON.stringify(data.user),
    expires_at: data.expires_at,
  });
  const fallbackUrl = `https://${slug}.replymesh.cloud/loja/${slug}/admin/impersonate`;
  const loginUrl = data.login_url && !data.login_url.includes("127.0.0.1") && !data.login_url.includes("localhost")
    ? data.login_url
    : fallbackUrl;

  return `${loginUrl}#${payload.toString()}`;
}
