import { useEffect } from "react";
import useLocalStorage from "./useLocalStorage";

export default function useColorMode() {
  const [colorMode, setColorMode] = useLocalStorage("color-theme", "light");

  useEffect(() => {
    // Always stay in light mode
    window.document.body.classList.remove("dark");
  }, [colorMode]);

  return ["light", setColorMode] as const;
}
