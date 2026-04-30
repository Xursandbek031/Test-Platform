import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface QDraft { id?: string; text: string; options: string[]; correct_index: number; }

const TeacherTestEditor = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeMinutes, setTimeMinutes] = useState(20);
  const [isPublished, setIsPublished] = useState(true);
  const [questions, setQuestions] = useState<QDraft[]>([{ text: "", options: ["", "", "", ""], correct_index: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew || !id) return;
    (async () => {
      const [tRes, qRes] = await Promise.all([
        supabase.from("tests").select("*").eq("id", id).single(),
        supabase.from("questions").select("*").eq("test_id", id).order("position"),
      ]);
      if (tRes.data) {
        setTitle(tRes.data.title);
        setDescription(tRes.data.description || "");
        setTimeMinutes(tRes.data.time_minutes);
        setIsPublished(tRes.data.is_published);
      }
      if (qRes.data && qRes.data.length > 0) {
        setQuestions(qRes.data.map((q: any) => ({
          id: q.id, text: q.text,
          options: Array.isArray(q.options) ? q.options : ["", "", "", ""],
          correct_index: q.correct_index,
        })));
      }
    })();
  }, [id, isNew]);

  const addQ = () => setQuestions([...questions, { text: "", options: ["", "", "", ""], correct_index: 0 }]);
  const removeQ = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i));
  const updateQ = (i: number, patch: Partial<QDraft>) => {
    setQuestions(questions.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  };

  const save = async () => {
    if (!user) return;
    if (!title.trim()) return toast.error("Test nomi kerak");
    const valid = questions.filter((q) => q.text.trim() && q.options.filter((o) => o.trim()).length >= 2);
    if (valid.length === 0) return toast.error("Kamida 1 ta to'liq savol kerak");

    setSaving(true);
    try {
      let testId = id!;
      if (isNew) {
        const { data, error } = await supabase.from("tests").insert({
          owner_id: user.id, title, description, time_minutes: timeMinutes, is_published: isPublished,
        }).select().single();
        if (error) throw error;
        testId = data.id;
      } else {
        const { error } = await supabase.from("tests").update({
          title, description, time_minutes: timeMinutes, is_published: isPublished,
        }).eq("id", testId);
        if (error) throw error;
        await supabase.from("questions").delete().eq("test_id", testId);
      }
      const payload = valid.map((q, i) => ({
        test_id: testId, position: i, text: q.text,
        options: q.options.filter((o) => o.trim()),
        correct_index: Math.min(q.correct_index, q.options.filter((o) => o.trim()).length - 1),
      }));
      const { error: qErr } = await supabase.from("questions").insert(payload);
      if (qErr) throw qErr;
      toast.success("Saqlandi");
      navigate("/teacher/tests");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link to="/teacher/tests"><ArrowLeft className="h-4 w-4" /> {t("teacher.tests")}</Link>
      </Button>

      <Card className="p-6 space-y-4">
        <h1 className="text-xl font-bold">{isNew ? t("teacher.newTest") : t("common.edit")}</h1>
        <div>
          <Label>{t("teacher.testTitle")}</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        </div>
        <div>
          <Label>{t("teacher.testDescription")}</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{t("teacher.timeMinutes")}</Label>
            <Input type="number" min={1} max={300} value={timeMinutes} onChange={(e) => setTimeMinutes(parseInt(e.target.value) || 20)} />
          </div>
          <div className="flex items-end gap-3 pb-2">
            <Switch checked={isPublished} onCheckedChange={setIsPublished} id="pub" />
            <Label htmlFor="pub">{t("teacher.published")}</Label>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <Card key={i} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground">{t("student.question")} {i + 1}</h3>
              {questions.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeQ(i)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Textarea
              placeholder={t("teacher.questionText")}
              value={q.text}
              onChange={(e) => updateQ(i, { text: e.target.value })}
              maxLength={500}
              rows={2}
            />
            <RadioGroup value={q.correct_index.toString()} onValueChange={(v) => updateQ(i, { correct_index: parseInt(v) })}>
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <RadioGroupItem value={oi.toString()} id={`q${i}-o${oi}`} />
                  <Input
                    placeholder={`${t("teacher.option")} ${oi + 1}`}
                    value={opt}
                    onChange={(e) => updateQ(i, { options: q.options.map((o, idx) => idx === oi ? e.target.value : o) })}
                    maxLength={300}
                  />
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">{t("teacher.correctOption")}: {q.correct_index + 1}</p>
          </Card>
        ))}
      </div>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={addQ} className="gap-2">
          <Plus className="h-4 w-4" /> {t("teacher.addQuestion")}
        </Button>
        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? t("common.loading") : t("common.save")}
        </Button>
      </div>
    </div>
  );
};

export default TeacherTestEditor;
