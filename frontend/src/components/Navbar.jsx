import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ChatBox from "./Chat";
import { MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "../contexts/ThemeContext";

const Navbar = () => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { isDarkMode } = useTheme();
  const menuRef = useRef(null);
  // Add click event listener to close menu when clicking outside
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setShowMenu(false);
    }
  };
  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      <nav
        className="flex w-full items-center justify-between border-b px-6 py-3 sticky top-0 z-40 transition-colors bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-gray-200 text-gray-900 shadow-sm dark:border-gray-800 dark:text-white"
      >
      <div className="flex items-center gap-4">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate('/main')}
          title="Return to Home"
        >
          <img
            src="/Navlogo.png"
            alt="Logo"
            className="size-8 rounded-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <h1
            className="text-2xl font-bold flex items-center whitespace-nowrap"
            style={{ fontSize: "1.7rem", lineHeight: "1.5rem" }}
          >
            Vox
            <span className="bg-gradient-to-br from-violet-500 to-pink-500 text-transparent bg-clip-text">
              Biz
            </span>
          </h1>
        </div>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`p-2 rounded-lg bg-transparent transition-colors hover:bg-transparent/5 dark:hover:bg-transparent/10`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>

        {showMenu && (
          <div
            className="absolute right-0 mt-2 w-48 rounded-xl shadow-xl py-2 bg-white dark:bg-slate-900 border border-gray-100 text-gray-900 dark:border-gray-800 dark:text-white z-50"
          >
            <div 
              onClick={() => {
                setShowMenu(false);
                navigate("/profile");
              }}
              className="px-4 py-3 mb-1 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">My Profile</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Manage account</p>
              </div>
            </div>

            <div className="px-4 py-2 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-medium">Theme</span>
              <ThemeToggle size="sm" />
            </div>

            {/* Logout divider */}
            <div className="border-t mt-1 mb-1 border-gray-100 dark:border-gray-800"></div>

            {/* Logout button */}
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setShowMenu(false);
                navigate("/login", { replace: true });
              }}
              className="w-full bg-transparent text-left block px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>

    {/* Floating Chatbot Button */}
    {!isChatOpen && (
      <button
        type="button"
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-16 right-6 z-50 inline-flex items-center justify-center p-3 text-white bg-violet-600 border-0 focus:outline-none hover:bg-violet-700 hover:scale-105 rounded-full shadow-xl transition-all duration-300 group"
        title="AI Chatbot"
      >
        <MessageSquare size={24} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:ml-2 font-medium">
          Chat with AI
        </span>
      </button>
    )}

    {/* ChatBox Floating Container */}
    {isChatOpen && (
      <div className="fixed bottom-[120px] right-6 z-50">
        <ChatBox
          onClose={handleCloseChat}
          theme={isDarkMode ? "dark" : "light"}
        />
      </div>
    )}
  </>
  );
};

export default Navbar;
