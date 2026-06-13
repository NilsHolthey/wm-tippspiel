import s from "../styles/Page.module.css";

export default function PageHeader({ children, right, style }) {
  return (
    <div className={s.ph} style={style}>
      <div className={s.ptitle}>{children}</div>
      {right}
    </div>
  );
}

PageHeader.Skeleton = function PageHeaderSkeleton({ style, width = 120 }) {
  return (
    <div className={s.ph} style={style}>
      <div className={s.skeletonBlock} style={{ width, height: 32, borderRadius: 6 }} />
    </div>
  );
};
