import s from "../styles/Page.module.css";

export default function EmptyState({ icon, children }) {
  return (
    <div className={s.emptyState}>
      {icon && <div className={s.emptyIcon}>{icon}</div>}
      <p className={s.emptyTitle}>{children}</p>
    </div>
  );
}
