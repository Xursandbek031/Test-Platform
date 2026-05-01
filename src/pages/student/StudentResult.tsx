import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Home, MinusCircle } from "lucide-react";

interface AnswerLog {
  questionId: string;
  questionText: string;
  options: string[];
  selected: number | null;
  correctIndex: number;
  isCorrect: boolean;
}

const StudentResult = () => {
  const { t } = useTranslation();
  const { resultId } = useParams<{ resultId: string }>();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem("lastResult");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.id === resultId) { setResult(parsed); return; }
    }
    // results table is owner-only; rely on cached. If missing, show empty.
  }, [resultId]);

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Natija topilmadi</p>
        <Button asChild><Link to="/">{t("student.backHome")}</Link></Button>
      </div>
    );
  }

  const answers: AnswerLog[] = result.answers || [];
  const score = Number(result.score_percent);
  const passed = score >= 60;

  return (
    <div className="min-h-screen gradient-subtle">
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-8 text-center shadow-elegant gradient-card">
            <div className={`inline-flex h-20 w-20 rounded-full items-center justify-center mb-4 ${passed ? "bg-success/10" : "bg-destructive/10"}`}>
              {passed ? <CheckCircle2 className="h-10 w-10 text-success" /> : <XCircle className="h-10 w-10 text-destructive" />}
            </div>
            <h1 className="text-3xl font-bold mb-2">{t("student.result")}</h1>
            <p className="text-muted-foreground mb-6">{result.student_first_name} {result.student_last_name}</p>
            <div className="text-6xl font-bold mb-4 bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">
              {score.toFixed(0)}%
            </div>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> {result.correct_count} {t("student.correct")}</div>
              <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive" /> {result.total_questions - result.correct_count} {t("student.incorrect")}</div>
            </div>
          </Card>

          <h2 className="text-lg font-semibold mt-8 mb-4">{t("student.reviewAnswers")}</h2>
          <div className="space-y-3">
            {answers.map((a, idx) => (
              <Card key={a.questionId} className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-xs font-semibold text-muted-foreground mt-1">{idx + 1}.</span>
                  <p className="flex-1 font-medium">{a.questionText}</p>
                  {a.selected === null
                    ? <MinusCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                    : a.isCorrect
                    ? <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    : <XCircle className="h-5 w-5 text-destructive shrink-0" />}
                </div>
                <div className="space-y-1.5 ml-6">
                  {a.options.map((opt, i) => {
                    const isCorrect = i === a.correctIndex;
                    const isSelected = i === a.selected;
                    return (
                      <div
                        key={i}
                        className={`text-sm px-3 py-2 rounded-md ${
                          isCorrect ? "bg-success/20 text-success border border-success/50 font-semibold"
                          : isSelected ? "bg-destructive/10 text-destructive border border-destructive/30"
                          : "text-muted-foreground"
                        }`}
                      >
                        {opt}
                        {isSelected && !isCorrect && <span className="ml-2 text-xs">({t("student.yourAnswer")})</span>}
                        {isCorrect && <span className="ml-2 text-xs">✓ {t("student.correctAnswer")}</span>}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button asChild size="lg" className="gap-2">
              <Link to="/"><Home className="h-4 w-4" /> {t("student.backHome")}</Link>
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default StudentResult;
