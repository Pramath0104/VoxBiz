import React from "react";
import { ThemeToggle as NavigationThemeToggle } from "./ui/theme-toggle";

const ThemeToggle = () => {
  return (
    <NavigationThemeToggle
      size="sm"
      className="absolute right-5 top-5 z-30"
    />
  );
};

export default ThemeToggle;
