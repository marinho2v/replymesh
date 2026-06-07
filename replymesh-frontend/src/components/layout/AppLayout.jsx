import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Toast } from "../shared/Toast.jsx";
import { groupFromPath } from "./navigation.js";
import { Sidebar as SidebarView } from "./Sidebar.jsx";
import { Topbar } from "./Topbar.jsx";
import { api } from "../../services/api.js";

export function AppLayout({ children, toast, user, onLogout }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState(() => groupFromPath(location.pathname));
  const [theme, setTheme] = useState(() => localStorage.getItem("replymesh_master_theme") || "light");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [branding, setBranding] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("replymesh_master_theme", theme);
  }, [theme]);

  useEffect(() => {
    let alive = true;
    const loadNotifications = async () => {
      try {
        const response = await api.getMasterNotifications();
        if (!alive) return;
        setNotifications(response.notifications || []);
        setUnreadCount(response.unread_count || 0);
      } catch {
        // O sino nao deve interromper o painel.
      }
    };
    loadNotifications();
    const timer = setInterval(loadNotifications, 60000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    let alive = true;
    const loadBranding = async () => {
      try {
        const response = await api.getMasterBranding();
        if (!alive) return;
        const next = response.branding || null;
        setBranding(next);
        if (next?.primary_color) document.documentElement.style.setProperty("--master-primary", next.primary_color);
        if (next?.secondary_color) document.documentElement.style.setProperty("--master-secondary", next.secondary_color);
        if (next?.favicon_url) {
          let favicon = document.querySelector("link[rel='icon']");
          if (!favicon) {
            favicon = document.createElement("link");
            favicon.rel = "icon";
            document.head.appendChild(favicon);
          }
          favicon.href = next.favicon_url;
        }
      } catch {
        // A marca padrao continua disponivel quando a API estiver offline.
      }
    };
    loadBranding();
    const refresh = () => loadBranding();
    window.addEventListener("replymesh:branding-updated", refresh);
    return () => { alive = false; window.removeEventListener("replymesh:branding-updated", refresh); };
  }, []);

  const readNotification = async (id) => {
    await api.readMasterNotification(id);
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const readAllNotifications = async () => {
    await api.readAllMasterNotifications();
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  };

  const visibleOpenGroup = openGroup || groupFromPath(location.pathname);

  return (
    <div className={`app${collapsed ? " collapsed" : ""}`}>
      <SidebarView collapsed={collapsed} setCollapsed={setCollapsed} openGroup={visibleOpenGroup} setOpenGroup={setOpenGroup} user={user} branding={branding} />
      <div className="main">
        <Topbar
          onMenu={() => setCollapsed((value) => !value)}
          user={user}
          onLogout={onLogout}
          theme={theme}
          onToggleTheme={() => setTheme((value) => value === "dark" ? "light" : "dark")}
          notifications={notifications}
          unreadCount={unreadCount}
          onReadNotification={readNotification}
          onReadAllNotifications={readAllNotifications}
        />
        {children}
      </div>
      <Toast toast={toast} />
    </div>
  );
}
