import { Icon } from "../ui/Icon.jsx";

export function Toast({ toast }) {
  if (!toast) return null;

  const icon = toast.kind === "ok" ? "CircleCheck" : toast.kind === "err" ? "CircleAlert" : "Info";
  const color = toast.kind === "ok" ? "#22c55e" : toast.kind === "err" ? "#f87171" : "#a1a1aa";

  return (
    <div className="toast" key={toast.msg}>
      <Icon name={icon} size={17} style={{ color }} />
      {toast.msg}
    </div>
  );
}
