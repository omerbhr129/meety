import { motion } from 'framer-motion';

export const LoadingSpinner = () => {
  return (
    <div className="fixed bottom-4 right-4 w-8 h-8">
      <motion.div
        className="w-full h-full rounded-full border-[3px] border-transparent"
        style={{
          borderTopColor: '#3B82F6',    // Blue
          borderRightColor: '#6366F1',  // Indigo
          borderBottomColor: '#8B5CF6', // Purple
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};
