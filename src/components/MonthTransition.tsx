import { motion, AnimatePresence, Variants } from "framer-motion";

interface MonthTransitionProps {
  children: React.ReactNode;
  direction: number;
  key: string | number;
}

const containerVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    scale: 0.95,
    rotateX: direction * -15
  }),
  center: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.4,
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  },
  exit: (direction: number) => ({
    opacity: 0,
    scale: 0.95,
    rotateX: direction * 15,
    transition: {
      duration: 0.3
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
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          perspective: '1200px'
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
