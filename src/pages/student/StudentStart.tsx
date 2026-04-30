import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, GraduationCap, Play } from "lucide-react";
import { LangSwitcher } from "@/components/LangSwitcher";
import { toast } from "sonner";

const schema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  groupId: z.string().min(1),
  testId: z.string().uuid(),
});

const StudentStart = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [tests, setTests] = useState<{ id: string; title: string; time_minutes: number }[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [testId, setTestId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [g, ts] = await Promise.all([
        supabase.from("groups").select("id, name").order("name"),
        supabase.from("tests").select("id, title, time_minutes").eq("is_published", true).order("created_at", { ascending: false }),
      ]);
      if (g.data) setGroups(g.data);
      if (ts.data) setTests(ts.data);
    })();
  }, []);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ firstName, lastName, groupId, testId });
    if (!parsed.success) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }
    setSubmitting(true);
    const group = groups.find((g) => g.id === groupId);
    sessionStorage.setItem(
      "studentSession",
      JSON.stringify({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        groupId,
        groupName: group?.name ?? "",
        testId,
      }),
    );
    navigate(`/student/test/${testId}`);
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
            <h1 className="text-3xl font-bold mb-2">{t("student.title")}</h1>
          </div>

          <Card className="p-6 shadow-soft">
            <form onSubmit={handleStart} className="space-y-4">
              <div>
                <Label htmlFor="fn">{t("student.firstName")}</Label>
                <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={50} required />
              </div>
              <div>
                <Label htmlFor="ln">{t("student.lastName")}</Label>
                <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={50} required />
              </div>
              <div>
                <Label>{t("student.group")}</Label>
                <Select value={groupId} onValueChange={setGroupId}>
                  <SelectTrigger><SelectValue placeholder={t("student.selectGroup")} /></SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("student.selectTest")}</Label>
                <Select value={testId} onValueChange={setTestId}>
                  <SelectTrigger><SelectValue placeholder={t("student.selectTest")} /></SelectTrigger>
                  <SelectContent>
                    {tests.map((tt) => (
                      <SelectItem key={tt.id} value={tt.id}>{tt.title} · {tt.time_minutes} min</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full gap-2" size="lg" disabled={submitting}>
                <Play className="h-4 w-4" /> {t("student.startTest")}
              </Button>
              {tests.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">Hozircha mavjud testlar yo'q</p>
              )}
            </form>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default StudentStart;
