import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-white selection:bg-sky-500/30">
      {/* Hero Section */}
      <section className="relative flex min-h-[50vh] items-center justify-center overflow-hidden pt-24">
        <div className="absolute inset-0 bg-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Meet <span className="bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">VoxBiz</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-neutral-400 sm:text-xl">
            The next generation of business intelligence. Converse with your data naturally, generate instant visualizations, and unlock actionable insights without writing a single line of code.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Feature 1 */}
          <div className="group rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-transparent/50 backdrop-blur-md p-8 transition-all shadow-sm hover:shadow-md">
            <div className="mb-6 inline-flex rounded-lg bg-sky-500/10 p-3 text-sky-500 dark:text-sky-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">Voice-Driven Analytics</h3>
            <p className="text-slate-600 dark:text-neutral-400">
              Ask questions about your data using your voice. Our AI understands natural language context and instantly fetches the exact metrics you need.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-transparent/50 backdrop-blur-md p-8 transition-all shadow-sm hover:shadow-md">
            <div className="mb-6 inline-flex rounded-lg bg-purple-500/10 p-3 text-purple-500 dark:text-purple-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">Instant Visualizations</h3>
            <p className="text-slate-600 dark:text-neutral-400">
              Automatically generate beautiful, interactive charts and graphs. Watch your data come to life and export reports in seconds.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-transparent/50 backdrop-blur-md p-8 transition-all shadow-sm hover:shadow-md">
            <div className="mb-6 inline-flex rounded-lg bg-green-500/10 p-3 text-green-600 dark:text-green-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">Secure & Private</h3>
            <p className="text-slate-600 dark:text-neutral-400">
              Your data is strictly isolated. Upload custom datasets knowing that enterprise-grade security keeps your business intelligence private.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative border-t border-slate-200 dark:border-white/10 bg-transparent py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl">Ready to talk to your data?</h2>
          <button
            onClick={() => navigate("/login")}
            className="rounded-md bg-sky-600 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-black focus:outline-none"
          >
            Get Started Now
          </button>
        </div>
      </section>
    </div>
  );
}
