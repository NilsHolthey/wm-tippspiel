import s from "./Stepper.module.css";

export default function Stepper({ value, onChange }) {
  return (
    <div className={s.stepper}>
      <button className={`${s.btn} ${s.top}`} onClick={() => onChange(Math.min(20, value + 1))}>
        <span className={s.icon}>+</span>
      </button>
      <div className={s.number}>
        <span className={s.val}>{value}</span>
      </div>
      <button
        className={`${s.btn} ${s.bot}`}
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
      >
        <span className={s.icon}>−</span>
      </button>
    </div>
  );
}
