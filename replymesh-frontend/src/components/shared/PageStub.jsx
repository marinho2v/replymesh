import { Icon } from "../ui/Icon.jsx";

export function PageStub({ title, subtitle = "Esta área faz parte do roadmap do painel master", icon = "LayoutDashboard" }) {
  return (
    <div className="page fade-up">
      <div className="page-head">
        <div>
          <div className="pt">{title}</div>
          <div className="ps">{subtitle}</div>
        </div>
      </div>
      <div className="card">
        <div className="empty">
          <div className="ei">
            <Icon name={icon} size={26} />
          </div>
          <div className="et">{title}</div>
          <div className="es">Módulo planejado para a próxima etapa. Dashboard, Empresas e WhatsApp já estão preservados no frontend React.</div>
        </div>
      </div>
    </div>
  );
}
