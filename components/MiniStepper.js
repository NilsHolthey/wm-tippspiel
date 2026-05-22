import s from "./MiniStepper.module.css";

export default function MiniStepper({ value, onChange }) {
  return (
    <div className={s.wrap}>
      <button className={`${s.btn} ${s.btnL}`} onClick={() => onChange(Math.max(0, value - 1))} disabled={value === 0}>
        <span className={s.icon}>−</span>
      </button>
      <span className={s.val}>{value}</span>
      <button className={`${s.btn} ${s.btnR}`} onClick={() => onChange(Math.min(20, value + 1))}>
        <span className={s.icon}>+</span>
      </button>
    </div>
  );
}
