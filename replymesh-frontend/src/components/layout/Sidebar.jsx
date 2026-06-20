import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../ui/Icon.jsx";
import { NAV } from "./navigation.js";

function activeGroup(pathname) {
  if (pathname.startsWith("/empresas")) return "empresas";
  if (pathname.startsWith("/whatsapp")) return "whatsapp";
  if (pathname.startsWith("/assinaturas")) return "assinaturas";
  if (pathname.startsWith("/dominios")) return "dominios";
  if (pathname.startsWith("/financeiro")) return "financeiro";
  if (pathname.startsWith("/usuarios-master")) return "usuarios";
  if (pathname.startsWith("/tickets")) return "tickets";
  return null;
}

function itemActive(item, pathname, search) {
  if (item.path === "/dashboard") return pathname === "/" || pathname === "/dashboard";
  if (item.id?.startsWith("empresas:") && pathname === "/empresas") {
    const tab = new URLSearchParams(search).get("tab") || "todas";
    return item.id === `empresas:${tab}`;
  }
  if (item.id === "empresas:nova") return pathname === "/empresas/nova";
  return pathname === item.path;
}

function NavGroup({ group, open, collapsed, setCollapsed, setOpenGroup }) {
  const navigate = useNavigate();
  const location = useLocation();
  const parentActive = activeGroup(location.pathname) === group.id;

  return (
    <div>
      <button
        className={`nav-item${parentActive && !open ? " active" : ""}`}
        onClick={() => {
          if (collapsed) {
            setCollapsed(false);
            setOpenGroup(group.id);
          } else {
            setOpenGroup(open ? null : group.id);
          }
        }}
        title={collapsed ? group.label : undefined}
      >
        <span className="ico">
          <Icon name={group.icon} size={19} />
        </span>
        <span className="label">{group.label}</span>
        {group.badge && <span className="pill">{group.badge}</span>}
        <Icon name="ChevronRight" size={15} className={`chev${open ? " open" : ""}`} />
      </button>
      <div className={`submenu${open && !collapsed ? " open" : ""}`}>
        <div className="submenu-inner">
          {group.children.map((child) => (
            <button
              key={child.id}
              className={`subitem${itemActive(child, location.pathname, location.search) ? " active" : ""}`}
              onClick={() => navigate(child.path)}
            >
              <span className="dot" />
              <span className="label">{child.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "AD";
}

export function Sidebar({ collapsed, setCollapsed, openGroup, setOpenGroup, user, branding }) {
  const navigate = useNavigate();
  const location = useLocation();
  const brandLogo = branding?.landing_logo_url || branding?.dark_logo_url || branding?.light_logo_url || "/mark.png";

  return (
    <aside className={`sidebar${collapsed ? " collapsed" : ""}`}>
      <div className="brand">
        <div className="brand-mark has-image">
          {brandLogo ? <img src={brandLogo} alt={branding?.platform_name || "Replymesh"} /> : <Icon name="Hexagon" size={22} strokeWidth={2.2} />}
        </div>
        <div className="brand-name">{branding?.platform_name || "REPLYMESH"}</div>
      </div>
      <nav className="nav">
        {NAV.map((item, index) => {
          if (item.type === "section") return <div className="nav-label" key={`${item.label}-${index}`}>{item.label}</div>;
          if (item.type === "group") {
            return (
              <NavGroup
                key={item.id}
                group={item}
                collapsed={collapsed}
                open={openGroup === item.id}
                setCollapsed={setCollapsed}
                setOpenGroup={setOpenGroup}
              />
            );
          }
          return (
            <div className={index > 0 && NAV[index - 1].type !== "section" ? "" : "nav-section"} key={item.id} style={{ marginTop: NAV[index - 1]?.type === "section" ? 0 : undefined }}>
              <button className={`nav-item${itemActive(item, location.pathname, location.search) ? " active" : ""}`} onClick={() => navigate(item.path)} title={collapsed ? item.label : undefined}>
                <span className="ico">
                  <Icon name={item.icon} size={19} />
                </span>
                <span className="label">{item.label}</span>
              </button>
            </div>
          );
        })}
      </nav>
      <div className="side-foot">
        <button className="side-user" style={{ width: "100%" }}>
          <span className="avatar">{user?.avatar_url ? <img src={user.avatar_url} alt="" /> : initials(user?.name)}</span>
          <span className="who">
            <span className="n">{user?.name || "Admin Master"}</span>
            <span className="e">{user?.email || "admin@replymesh.cloud"}</span>
          </span>
          <Icon name="EllipsisVertical" size={16} className="more" style={{ color: "var(--side-text-dim)" }} />
        </button>
        <button className="collapse-btn" onClick={() => setCollapsed((value) => !value)}>
          <Icon name={collapsed ? "ChevronsRight" : "ChevronsLeft"} size={16} />
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
