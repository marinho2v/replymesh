export function Switch({ on, onClick }) {
  return (
    <button type="button" className={`switch${on ? " on" : ""}`} onClick={onClick} aria-pressed={on}>
      <span className="knob" />
    </button>
  );
}
