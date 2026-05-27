import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import s from "./Stepper.module.css";
import { haptic } from "../../utils/haptic";

export default function Stepper({ value, onChange }) {
  const dirRef = useRef(1);

  function increment() {
    dirRef.current = 1;
    haptic(4);
    onChange(Math.min(20, value + 1));
  }

  function decrement() {
    dirRef.current = -1;
    haptic(4);
    onChange(Math.max(0, value - 1));
  }

  return (
    <div className={s.stepper}>
      <button className={`${s.btn} ${s.top}`} onClick={increment}>
        <span className={s.icon}>+</span>
      </button>
      <div className={s.number}>
        <AnimatePresence mode="popLayout" custom={dirRef.current} initial={false}>
          <motion.span
            key={value}
            className={`${s.val}${value === 0 ? " " + s.zero : ""}`}
            custom={dirRef.current}
            variants={{
              enter: (d) => ({ y: d * 14, opacity: 0 }),
              center: { y: 0, opacity: 1 },
              exit:  (d) => ({ y: d * -14, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.13, ease: "easeInOut" }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <button
        className={`${s.btn} ${s.bot}`}
        onClick={decrement}
        disabled={value === 0}
      >
        <span className={s.icon}>−</span>
      </button>
    </div>
  );
}
