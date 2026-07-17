"use client";

import React, { useRef, useState } from "react";

import { useTheme } from "../contexts/ThemeContext";

export function DemoPage() {
  const { isDarkMode: darkMode } = useTheme();
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);



  const handleButtonClick = () => {
    setShowVideo(true);
    setTimeout(() => {
      if (videoRef.current) videoRef.current.play();
    }, 100);
  };

  const handleVisibilityChange = (isVisible) => {
    if (videoRef.current) {
      if (isVisible) videoRef.current.play();
      else videoRef.current.pause();
    }
  };

  return (
    <>
<div className="flex-grow relative">
        

        <div className="container mx-auto px-4 py-10 md:py-20 relative z-10 flex flex-col items-center justify-center min-h-[80vh]">
          <div className={`w-full max-w-4xl relative z-10 rounded-3xl border p-4 shadow-md ${
              darkMode
                ? "border-neutral-800 bg-neutral-900"
                : "border-neutral-200 bg-neutral-100"
            }`}
          >
            <div
              className={`w-full overflow-hidden rounded-xl border ${
                darkMode ? "border-gray-700" : "border-gray-300"
              }`}
            >
              <div className="aspect-[16/9] h-auto w-full bg-gradient-to-br from-blue-500 to-purple-600 p-8">
                <div
                  className={`flex h-full flex-col items-center justify-center p-8 rounded-xl transition-colors ${
                    darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
                  }`}
                >
                  <div className="text-3xl font-bold mb-6 text-center">
                    Speech Visualization Demo
                  </div>

                  {!showVideo ? (
                    <>
                      <p className={`mb-6 text-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Click any button below to start the demo
                      </p>
                      <div className="flex justify-center w-full max-w-2xl mx-auto">
                        <button
                          onClick={handleButtonClick}
                          className={`backdrop-blur-sm rounded-lg px-8 py-4 text-lg font-medium text-center cursor-pointer transition-colors duration-200 shadow-md ${
                            darkMode 
                              ? "bg-indigo-900/50 hover:bg-indigo-800/70 text-white" 
                              : "bg-indigo-50 hover:bg-indigo-100 text-indigo-900"
                          }`}
                        >
                          Start Demo
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex-grow flex items-center justify-center">
                      <div className="w-full h-full max-w-2xl">
                        <video
                          ref={videoRef}
                          src="/demo.mp4"
                          className="w-full h-full object-contain rounded-lg"
                          controls
                          autoPlay
                          onPlay={() => {
                            if (videoRef.current) {
                              const observer = new IntersectionObserver(
                                ([entry]) => {
                                  handleVisibilityChange(entry.isIntersecting);
                                },
                                { threshold: 0.5 },
                              );
                              observer.observe(videoRef.current);
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
</>
  );
}
