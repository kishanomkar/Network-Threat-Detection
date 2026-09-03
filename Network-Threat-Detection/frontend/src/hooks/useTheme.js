import { useEffect, useState } from "react";
import { readTheme, writeTheme } from "../utils/storage.js";

export const useTheme = () => {
  const [theme, setTheme] = useState(() => readTheme());

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    writeTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return { theme, toggleTheme };
};

