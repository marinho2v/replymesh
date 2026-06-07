import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../ui/Icon.jsx";

export function MasterNotifications({ open, onClose, notifications, unreadCount, onRead, onReadAll }) {
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open, onClose]);

  if (!open) return null;

  const visit = (item) => {
    if (!item.read) onRead(item.id);
    if (item.link_url) navigate(item.link_url);
    onClose();
  };

  return (
    <div className="master-notifications" ref={ref}>
      <div className="master-notifications-head">
        <div><strong>Notificacoes</strong><span>{unreadCount} nao lidas</span></div>
        {unreadCount > 0 && <button onClick={onReadAll}><Icon name="CheckCheck" size={15} /> Marcar todas</button>}
      </div>
      <div className="master-notifications-list">
        {notifications.map((item) => (
          <button key={item.id} className={`master-notification${item.read ? "" : " unread"}`} onClick={() => visit(item)}>
            <span className="master-notification-icon"><Icon name={item.notification_type === "ticket" ? "LifeBuoy" : item.notification_type === "system_update" ? "Megaphone" : "Bell"} size={16} /></span>
            <span><strong>{item.title}</strong>{item.message && <small>{item.message}</small>}</span>
            {!item.read && <i />}
          </button>
        ))}
        {notifications.length === 0 && <div className="empty-update"><Icon name="Bell" size={25} /><p>Nenhuma notificacao.</p></div>}
      </div>
    </div>
  );
}
