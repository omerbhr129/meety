import { motion, AnimatePresence, Variants } from "framer-motion";

interface MonthTransitionProps {
  children: React.ReactNode;
  direction: number;
  key: string | number;
}

const containerVariants: Variants = {
  enter: (direction: number) => ({
    x: direction * 20,
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
      opacity: { duration: 0.3 }
    }
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
      opacity: { duration: 0.3 }
    }
  },
  exit: (direction: number) => ({
    x: direction * -20,
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
      opacity: { duration: 0.3 }
    }
  })
};

export function MonthTransition({ children, direction, key }: MonthTransitionProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        custom={direction}
        variants={containerVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
