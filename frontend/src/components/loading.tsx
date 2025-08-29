'use client';

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex justify-center items-center w-full h-full overflow-hidden">
      <div className="flex justify-center items-center space-x-3 sm:space-x-6">
        {/* Connect 4 pieces with responsive sizing and instant animation start */}
        <motion.div 
          className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-red-500 rounded-full shadow-lg"
          initial={{ y: 0 }}
          animate={{ 
            y: [0, -20, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0
          }}
        />
        <motion.div 
          className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-yellow-400 rounded-full shadow-lg"
          initial={{ y: 0 }}
          animate={{ 
            y: [0, -20, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2
          }}
        />
        <motion.div 
          className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-red-500 rounded-full shadow-lg"
          initial={{ y: 0 }}
          animate={{ 
            y: [0, -20, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.4
          }}
        />
        <motion.div 
          className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-yellow-400 rounded-full shadow-lg"
          initial={{ y: 0 }}
          animate={{ 
            y: [0, -20, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.6
          }}
        />
      </div>
    </div>
  );
}