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
  const localHosts = [ ["127", "0", "0", "1"].join("."), ["local", "host"].join("") ];
  const parsedLoginUrl = data.login_url ? new URL(data.login_url) : null;
  const responseUrl = parsedLoginUrl && !localHosts.includes(parsedLoginUrl.hostname)
    ? parsedLoginUrl
    : new URL(`https://${slug}.replymesh.cloud`);
  const loginUrl = `${responseUrl.origin}/admin/impersonate`;

  return `${loginUrl}#${payload.toString()}`;
}
