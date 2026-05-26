import Image from "next/image";
import s from "./LoadingScreen.module.css";

export default function LoadingScreen() {
  return (
    <div className={s.overlay}>
      <div className={s.inner}>
        <div className={s.iconWrap}>
          <Image src="/icons/Icon_logo.png" alt="" width={72} height={72} priority />
        </div>
        <div className={s.bar}>
          <div className={s.barFill} />
        </div>
      </div>
    </div>
  );
}
