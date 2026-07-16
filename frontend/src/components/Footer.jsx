import React from "react";

const Footer = ({ className = "" }) => {
  return (
    <footer
      className={`mt-auto py-4 text-center backdrop-blur-sm bg-white/30 dark:bg-transparent/30 ${className}`}
    >
      <p className="text-sm">© 2025 Data Visualization Platform</p>
    </footer>
  );
};

export default Footer;
