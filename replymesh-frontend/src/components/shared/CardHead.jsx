import { Icon } from "../ui/Icon.jsx";

export function CardHead({ title, action }) {
  return (
    <div className="card-head">
      <div className="ct">{title}</div>
      <div className="grow" />
      {action}
    </div>
  );
}

export function SeeAll({ onClick, label = "Ver todas" }) {
  return (
    <button className="link" onClick={onClick}>
      {label}
      <Icon name="ChevronRight" size={14} />
    </button>
  );
}
