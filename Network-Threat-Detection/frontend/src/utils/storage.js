const HISTORY_KEY = "prediction-history";
const THEME_KEY = "prediction-dashboard-theme";

export const readHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
};

export const writeHistory = (items) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
};

export const readTheme = () => localStorage.getItem(THEME_KEY) || "light";

export const writeTheme = (theme) => {
  localStorage.setItem(THEME_KEY, theme);
};

