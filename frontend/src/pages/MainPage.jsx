"use client";

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { FlipWords } from "../components/ui/flip-words";
import { useTheme } from "../contexts/ThemeContext";

export function MainPage() {
  const navigate = useNavigate();
  const features = [
    "AI-powered",
    "Collaborative",
    "Real-time",
    "Multilingual",
    "Intuitive",
  ];
  const { isDarkMode: darkMode } = useTheme();


  // Languages with their native scripts
  const languages = [
    { name: "English", native: "English" },
    { name: "Hindi", native: "हिन्दी" },
    { name: "Kannada", native: "ಕನ್ನಡ" },
    { name: "Tamil", native: "தமிழ்" },
    { name: "Telugu", native: "తెలుగు" },
    { name: "Malayalam", native: "മലയാളം" },
  ];

  const scrollToDemo = () => {
    navigate("/demo");
  };



  // Ref for query animation section
  const queryAnimationRef = useRef(null);

  const queries = [
    "SELECT * FROM speech WHERE language='Kannada' AND confidence > 0.8",
    "ANALYZE sentiment GROUPBY speaker ORDER BY positivity DESC",
    "VISUALIZE word_frequency ACROSS languages LIMIT 15",
  ];

  return (
    <>
<div className="flex-grow relative">
        {/* Removed background image to allow global Threads effect to show */}
        <div className="container mx-auto px-4 py-10 md:py-20 relative z-10">
          <h1 className="mx-auto max-w-4xl text-center text-2xl font-bold md:text-4xl lg:text-7xl">
            {"Transform Speech into Visual Data"
              .split(" ")
              .map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.1,
                    ease: "easeInOut",
                  }}
                  className="mr-2 inline-block"
                >
                  {word}
                </motion.span>
              ))}
          </h1>

          <div className="mx-auto max-w-2xl py-8 text-center text-2xl font-normal">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-2"
            >
              Your <span className="font-semibold text-blue-500">AI-powered</span> visualization platform
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 1.5 }}
            className="mx-auto max-w-xl py-6 text-center text-lg font-normal"
          >
            Convert spoken words into dynamic visualizations instantly. Our
            platform understands multiple languages and creates meaningful
            visual representations in real-time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 1.8 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              className={`w-60 transform rounded-lg px-6 py-2 font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                darkMode
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              onClick={() => navigate("/dblist")}
            >
              Start Visualizing
            </button>
            <button
              onClick={scrollToDemo}
              className={`w-60 transform rounded-lg px-6 py-2 font-medium transition-all duration-300 hover:-translate-y-0.5 ${
                darkMode
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              View Demo
            </button>
          </motion.div>


          {/* Query Animation Section */}
          <div ref={queryAnimationRef} className="relative z-10 mt-32 mb-32">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false, margin: "-100px" }}
              className={`text-center text-4xl font-bold mb-16 ${
                darkMode ? "text-slate-300" : "text-slate-800"
              }`}
            >
              Powerful Query Visualization
            </motion.h2>
            <div className="relative bg-transparent rounded-xl p-6 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
              {queries.map((query, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.3,
                    ease: "easeOut",
                  }}
                  className="font-mono mb-6 last:mb-0"
                >
                  <div className="flex items-start">
                    <span className="text-green-400 mr-2">{">"}</span>
                    <div className="relative overflow-hidden">
                      <span className="text-green-300 whitespace-nowrap block">
                        {query}
                      </span>
                      <motion.div
                        initial={{ width: "100%" }}
                        whileInView={{ width: "0%" }}
                        viewport={{ once: false, margin: "-100px" }}
                        transition={{
                          duration: 1.2,
                          delay: 0.2 + index * 0.3,
                          ease: "easeInOut",
                        }}
                        className="absolute top-0 right-0 h-full bg-transparent"
                        style={{ zIndex: 1 }}
                      />
                    </div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: false, margin: "-100px" }}
                    transition={{
                      duration: 0.5,
                      delay: 1 + index * 0.3,
                      ease: "easeOut",
                    }}
                    className="ml-6 mt-2 h-3 bg-gradient-to-r from-green-400/50 to-blue-400/50 rounded-full"
                    style={{ width: `${65 - index * 10}%` }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
</>
  );
}
