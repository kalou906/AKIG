import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";

const readPreference = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(STORAGE_KEY) === "dark";
};

export default function ThemeToggle() {
  const [dark, setDark] = useState(readPreference);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const classList = document.documentElement.classList;
    if (dark) {
      classList.add("dark");
    } else {
      classList.remove("dark");
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
    }
  }, [dark]);

  return (
    <button
      type="button"
      className="rounded border px-3 py-2"
      aria-pressed={dark}
      onClick={() => setDark((value) => !value)}
    >
      Mode sombre
    </button>
  );
}
