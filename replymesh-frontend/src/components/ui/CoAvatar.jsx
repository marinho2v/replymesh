import { useMemo } from "react";

const TINTS = ["#fef3c7", "#dbeafe", "#fee2e2", "#dcfce7", "#f3e8ff", "#ffedd5", "#e0e7ff", "#fce7f3"];
const TINTS_FG = ["#92400e", "#1e40af", "#991b1b", "#166534", "#6b21a8", "#9a3412", "#3730a3", "#9d174d"];

export function CoAvatar({ name, imageUrl = "", size = 34, radius = 9 }) {
  const i = useMemo(() => {
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h % TINTS.length;
  }, [name]);
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: TINTS[i],
        color: TINTS_FG[i],
        display: "grid",
        placeItems: "center",
        fontWeight: 700,
        fontSize: size * 0.4,
        flex: "0 0 auto",
        border: "1px solid rgba(0,0,0,.05)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span>{initials}</span>
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "inherit",
          }}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}
