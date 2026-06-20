import { useEffect, useRef, useState } from "react";
import { Icon } from "../ui/Icon.jsx";
import { MasterNotifications } from "./MasterNotifications.jsx";
import { useNavigate } from "react-router-dom";

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AD";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function roleLabel(role) {
  if (role === "super_admin") return "Super Admin";
  if (role === "user") return "Usuario";
  return role || "Perfil local";
}

function UserAvatar({ user, name, size }) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <span className="avatar" style={style}>
      {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : initials(name)}
    </span>
  );
}

export function Topbar({ onMenu, user, onLogout, theme, onToggleTheme, notifications, unreadCount, onReadNotification, onReadAllNotifications }) {
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const name = user?.name || "Admin Master";
  const email = user?.email || "admin@replymesh.cloud";
  const profile = roleLabel(user?.global_role);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector(".search input")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const logout = () => {
    setOpen(false);
    onLogout?.();
  };

  return (
    <header className="topbar">
      <button className="icon-btn" onClick={onMenu} title="Menu">
        <Icon name="Menu" size={20} />
      </button>
      <div className="search">
        <Icon name="Search" size={17} className="si" />
        <input placeholder="Buscar empresas, dominios, usuarios..." />
        <span className="kbd"><span>Ctrl</span><span>K</span></span>
      </div>
      <div className="top-right">
        <button className="icon-btn" onClick={onToggleTheme} title={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}>
          <Icon name={theme === "dark" ? "Sun" : "Moon"} size={19} />
        </button>
        <div className="master-notifications-wrap">
          <button className="icon-btn badge-dot" onClick={() => setNotificationsOpen((value) => !value)} title="Notificacoes">
            <Icon name="Bell" size={19} />
            {unreadCount > 0 && <span className="cnt">{unreadCount > 99 ? "99+" : unreadCount}</span>}
          </button>
          <MasterNotifications open={notificationsOpen} onClose={() => setNotificationsOpen(false)} notifications={notifications} unreadCount={unreadCount} onRead={onReadNotification} onReadAll={onReadAllNotifications} />
        </div>
        <div className="top-user-wrap" ref={menuRef}>
          <button className={`top-user${open ? " active" : ""}`} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu">
            <UserAvatar user={user} name={name} size={36} />
            <span className="who" style={{ textAlign: "left" }}>
              <span className="n">{name}</span>
              <span className="e">{email}</span>
            </span>
            <Icon name="ChevronDown" size={16} style={{ color: "var(--muted)" }} />
          </button>

          {open && (
            <div className="user-menu" role="menu">
              <div className="user-menu-head">
                <UserAvatar user={user} name={name} />
                <div>
                  <div className="um-name">{name}</div>
                  <div className="um-email">{email}</div>
                </div>
              </div>
              <button className="user-menu-profile" onClick={() => { setOpen(false); navigate("/perfil"); }}>
                <Icon name="UserRound" size={16} />
                <span>Meu perfil</span>
              </button>
              <div className="user-menu-row">
                <span>Perfil</span>
                <strong>{profile}</strong>
              </div>
              <button className="user-menu-action" onClick={logout} role="menuitem">
                <Icon name="LogOut" size={16} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
