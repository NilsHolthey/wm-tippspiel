import s from "./MatchCardSkeleton.module.css";

export default function MatchCardSkeleton() {
  return (
    <div className={s.card}>
      <div className={s.inner}>
        <div className={s.metaRow}>
          <div className={`${s.bone} ${s.metaPill}`} />
          <div className={`${s.bone} ${s.metaDate}`} />
        </div>
        <div className={s.row}>
          <div className={s.team}>
            <div className={`${s.bone} ${s.flag}`} />
            <div className={`${s.bone} ${s.name}`} />
          </div>
          <div className={`${s.bone} ${s.score}`} />
          <div className={`${s.team} ${s.teamAway}`}>
            <div className={`${s.bone} ${s.name}`} />
            <div className={`${s.bone} ${s.flag}`} />
          </div>
        </div>
      </div>
      <div className={s.strip}>
        <div className={`${s.bone} ${s.stripLeft}`} />
        <div className={`${s.bone} ${s.stripRight}`} />
      </div>
    </div>
  );
}
