import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Users, ArrowRight, BookOpen } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";

const Index = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="container mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl gradient-hero flex items-center justify-center shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">{t("app.name")}</span>
        </div>
        <LangSwitcher />
      </header>

      <main className="container mx-auto px-6 pt-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6">
            <BookOpen className="h-3 w-3" />
            {t("app.tagline")}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
            {t("home.title")}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t("home.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link to="/student" className="group block">
              <Card className="p-8 h-full transition-smooth hover:shadow-elegant hover:-translate-y-1 gradient-card border-border/60">
                <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mb-5 group-hover:scale-110 transition-smooth">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t("common.student")}</h2>
                <p className="text-muted-foreground mb-6">{t("home.studentDesc")}</p>
                <div className="flex items-center gap-2 text-primary font-medium">
                  {t("home.getStarted")}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-smooth" />
                </div>
              </Card>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to="/teacher/login" className="group block">
              <Card className="p-8 h-full transition-smooth hover:shadow-elegant hover:-translate-y-1 gradient-hero text-primary-foreground border-0">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-5 group-hover:scale-110 transition-smooth">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t("common.teacher")}</h2>
                <p className="text-primary-foreground/85 mb-6">{t("home.teacherDesc")}</p>
                <div className="flex items-center gap-2 font-medium">
                  {t("common.login")}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-smooth" />
                </div>
              </Card>
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;
