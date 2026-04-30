import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  fullName: z.string().trim().min(1).max(100).optional(),
});

const TeacherLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate("/teacher/tests", { replace: true }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, fullName: mode === "signup" ? fullName : undefined });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Xush kelibsiz!");
        navigate("/teacher/tests");
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/teacher/tests`, data: { full_name: fullName } },
        });
        if (error) throw error;
        toast.success("Hisob yaratildi!");
        navigate("/teacher/tests");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="container mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-smooth">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </Link>
        <LangSwitcher />
      </header>
      <main className="container mx-auto px-6 py-8 max-w-md">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 rounded-2xl gradient-hero items-center justify-center shadow-glow mb-4">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{mode === "login" ? t("teacher.login") : t("teacher.signupTitle")}</h1>
          </div>

          <Card className="p-6 shadow-soft">
            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <Label htmlFor="fn">{t("teacher.fullName")}</Label>
                  <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} required />
                </div>
              )}
              <div>
                <Label htmlFor="em">{t("common.email")}</Label>
                <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required />
              </div>
              <div>
                <Label htmlFor="pw">{t("common.password")}</Label>
                <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} maxLength={72} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading} size="lg">
                {loading ? t("common.loading") : mode === "login" ? t("common.login") : t("common.signup")}
              </Button>
              <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="w-full text-sm text-muted-foreground hover:text-foreground transition-smooth">
                {mode === "login" ? `${t("teacher.noAccount")} ${t("common.signup")}` : `${t("teacher.haveAccount")} ${t("common.login")}`}
              </button>
            </form>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default TeacherLogin;
