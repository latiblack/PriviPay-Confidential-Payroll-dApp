import { useState, useEffect } from "react";
import { t as translate } from "@/lib/i18n";

export const useTranslation = () => {
  const [, setUpdate] = useState(0);

  useEffect(() => {
    const handleStorage = () => setUpdate(n => n + 1);
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const t = (key: string): string => translate(key);

  return { t };
};