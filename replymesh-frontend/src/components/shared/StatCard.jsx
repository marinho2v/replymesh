import { Icon } from "../ui/Icon.jsx";

export function StatCard({ icon, label, value, delta, dir = "up" }) {
  return (
    <div className="card stat">
      <div className="top">
        <div className="si">
          <Icon name={icon} size={19} />
        </div>
        <div className="lab">{label}</div>
      </div>
      <div className="val">{value}</div>
      <div className={`delta ${dir}`}>
        {dir !== "flat" && <Icon name={dir === "up" ? "TrendingUp" : "TrendingDown"} size={14} />}
        {delta}
      </div>
    </div>
  );
}
