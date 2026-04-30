import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, FileSpreadsheet, Download, Clock, FileText } from "lucide-react";
import { toast } from "sonner";

interface Test { id: string; title: string; time_minutes: number; is_published: boolean; created_at: string; questions: { count: number }[]; }

const TeacherTests = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tests")
      .select("id, title, time_minutes, is_published, created_at, questions(count)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setTests((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("tests").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("O'chirildi");
    load();
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["question", "option1", "option2", "option3", "option4", "correct"],
      ["O'zbekiston poytaxti?", "Toshkent", "Samarqand", "Buxoro", "Xiva", 1],
      ["2 + 2 = ?", "3", "4", "5", "6", 2],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "test-template.xlsx");
  };

  const handleExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);
      if (rows.length === 0) throw new Error("Bo'sh fayl");

      const title = file.name.replace(/\.xlsx?$/i, "");
      const { data: test, error: tErr } = await supabase
        .from("tests")
        .insert({ owner_id: user.id, title, time_minutes: 20, is_published: true })
        .select().single();
      if (tErr) throw tErr;

      const questions = rows.map((r, i) => {
        const opts = [r.option1, r.option2, r.option3, r.option4].filter((o) => o != null && o !== "").map(String);
        const correct = Math.max(0, Math.min(opts.length - 1, (parseInt(r.correct) || 1) - 1));
        return {
          test_id: test.id, position: i, text: String(r.question || ""),
          options: opts, correct_index: correct,
        };
      }).filter((q) => q.text && q.options.length >= 2);

      if (questions.length === 0) throw new Error("Yaroqli savollar topilmadi");
      const { error: qErr } = await supabase.from("questions").insert(questions);
      if (qErr) throw qErr;
      toast.success(`${questions.length} ta savol yuklandi`);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("teacher.tests")}</h1>
          <p className="text-sm text-muted-foreground">{tests.length} ta test</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
            <Download className="h-4 w-4" /> {t("teacher.downloadTemplate")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> {t("teacher.importExcel")}
          </Button>
          <input ref={fileInput} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcel} />
          <Button asChild size="sm" className="gap-2">
            <Link to="/teacher/tests/new"><Plus className="h-4 w-4" /> {t("teacher.newTest")}</Link>
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
        💡 {t("teacher.excelFormat")}
      </p>

      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : tests.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t("teacher.noTests")}</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((test) => (
            <Card key={test.id} className="p-5 hover:shadow-soft transition-smooth">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold line-clamp-2 flex-1">{test.title}</h3>
                <Badge variant={test.is_published ? "default" : "secondary"} className="ml-2">
                  {test.is_published ? t("teacher.published") : t("teacher.draft")}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {test.time_minutes} min</span>
                <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {test.questions[0]?.count || 0} {t("teacher.questionsCount")}</span>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1 gap-1">
                  <Link to={`/teacher/tests/${test.id}`}><Pencil className="h-3 w-3" /> {t("common.edit")}</Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("teacher.deleteTestConfirm")}</AlertDialogTitle>
                      <AlertDialogDescription>{test.title}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(test.id)}>{t("common.delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherTests;
