'use client';

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex justify-center items-center">
      <div className="flex justify-center items-center h-full w-full absolute inset-0">
        <div className="flex justify-center items-center space-x-6">
          {/* Connect 4 pieces with smooth framer-motion animation */}
          <motion.div 
            className="w-20 h-20 bg-red-500 rounded-full shadow-lg"
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
            className="w-20 h-20 bg-yellow-400 rounded-full shadow-lg"
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
            className="w-20 h-20 bg-red-500 rounded-full shadow-lg"
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
            className="w-20 h-20 bg-yellow-400 rounded-full shadow-lg"
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
    </div>
  );
}