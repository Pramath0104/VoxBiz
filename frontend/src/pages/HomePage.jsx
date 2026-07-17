"use client";

import React from "react";
import { useNavigate } from "react-router-dom";

import ThemeToggle from "../components/ThemeToggle";
export function ThreeDMarqueeBg() {
  const navigate = useNavigate();

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden bg-transparent">
      <ThemeToggle />
      <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-7xl px-4 py-16">
        <h2 className="mx-auto max-w-4xl text-center text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
          Revolutionize Your Business Insights with{" "}
          <span className="relative inline-block rounded-xl bg-blue-500/40 px-4 py-1 text-slate-900 dark:text-white underline decoration-sky-500 decoration-4 underline-offset-8 backdrop-blur-sm">
            VoxBiz
          </span>
        </h2>
        <p className="mx-auto max-w-2xl py-8 text-center text-base text-slate-700 dark:text-neutral-200 lg:text-lg">
          Transform your data into actionable insights using voice-driven
          queries. Experience real-time analytics and data visualization that
          empower you to make smarter, data-informed decisions.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            className="rounded-md bg-sky-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-black focus:outline-none"
            onClick={() => navigate("/login")}
          >
            Get Started
          </button>
          <button 
            className="rounded-md border border-slate-300 dark:border-white/20 bg-slate-200/50 dark:bg-white/10 px-6 py-3 text-sm font-medium text-slate-900 dark:text-white backdrop-blur-sm transition-colors hover:bg-slate-300/50 dark:hover:bg-white/20 focus:ring-2 focus:ring-slate-400 dark:focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black focus:outline-none"
            onClick={() => navigate("/about")}
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
