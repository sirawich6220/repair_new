"use client";
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="vh-100 d-flex justify-content-center align-items-center"
         style={{ background: "#F4F6F7" }}>

      <motion.div
        initial={{ scale: 0.6, opacity: 0.3 }}
        animate={{
          scale: [0.6, 1.2, 0.6],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          width: 130,
          height: 130,
          borderRadius: "50%",
          border: "4px solid #0ba34f",
        }}
      />
    </div>
  );
}
