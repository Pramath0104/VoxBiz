import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useTheme } from "../contexts/ThemeContext";

const MainLayout = ({ children, className = "" }) => {
  const { isDarkMode } = useTheme();
  
  // Some pages originally used standard Tailwind dark mode (dark:text-white)
  // while others explicitly checked the theme context. This unifies it.
  const themeClasses = isDarkMode ? "text-white" : "text-gray-900";

  return (
    <div className={`flex flex-col w-screen min-h-screen bg-transparent ${themeClasses} ${className}`}>
      <Navbar />
      <main className="flex-grow relative">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
