import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export const LangSwitcher = () => {
  const { i18n } = useTranslation();
  const toggle = () => {
    const next = i18n.language === "uz" ? "en" : "uz";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };
  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="gap-2">
      <Globe className="h-4 w-4" />
      <span className="uppercase text-xs font-semibold">{i18n.language}</span>
    </Button>
  );
};
