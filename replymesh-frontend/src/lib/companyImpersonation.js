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
  const responseUrl = data.login_url && !data.login_url.includes("127.0.0.1") && !data.login_url.includes("localhost")
    ? new URL(data.login_url)
    : new URL(`https://${slug}.replymesh.cloud`);
  const loginUrl = `${responseUrl.origin}/loja/${slug}/admin/impersonate`;

  return `${loginUrl}#${payload.toString()}`;
}
