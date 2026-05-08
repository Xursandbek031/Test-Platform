import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { supabase } from "@/integrations/supabase/client"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

interface Question { id: string; text: string; options: string[]; correct_index: number; position: number }
interface SessionData { firstName: string; lastName: string; groupId: string; groupName: string; testId: string }

const StudentTest = () => {
  const { t } = useTranslation()
  const { testId } = useParams<{ testId: string }>()
  const navigate = useNavigate()
  const [test, setTest] = useState<{ id: string; title: string; time_minutes: number } | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [current, setCurrent] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [startedAt] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const session: SessionData | null = useMemo(() => {
    const raw = sessionStorage.getItem("studentSession")
    return raw ? JSON.parse(raw) : null
  }, [])

  const submit = useCallback(async () => {
    if (!test) return
    const totalQuestions = questions.length
    let correct = 0
    const answerLog = questions.map((q) => {
      const selected = answers[q.id]
      const isCorrect = selected === q.correct_index
      if (isCorrect) correct++
      return {
        questionId: q.id,
        questionText: q.text,
        options: q.options,
        selected: selected ?? null,
        correctIndex: q.correct_index,
        isCorrect,
      }
    })
    const score = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0
    const timeTaken = Math.floor((Date.now() - startedAt) / 1000)
    const { data, error } = await supabase
      .from("results")
      .insert([
        {
          test_id: test.id,
          student_first_name: session!.firstName,
          student_last_name: session!.lastName,
          group_id: session!.groupId,
          group_name: session!.groupName,
          total_questions: totalQuestions,
          correct_count: correct,
          score_percent: Number(score.toFixed(2)),
          answers: answerLog,
          time_taken_seconds: timeTaken,
        }
      ])
      .select()
      .single()

    if (error) {
      toast.error(error.message)
      return
    }
    sessionStorage.setItem("lastResult", JSON.stringify(data))
    sessionStorage.removeItem("studentSession")
    navigate(`/student/result/${data.id}`)

  }, [test, questions, answers, session, startedAt, navigate])

  useEffect(() => {
    if (!session || session.testId !== testId) {
      navigate("/student", { replace: true })
      return
    }
    (async () => {
      const [tRes, qRes] = await Promise.all([
        supabase.from("tests").select("id, title, time_minutes").eq("id", testId).single(),
        supabase.from("questions").select("id, text, options, correct_index, position").eq("test_id", testId).order("position"),
      ])
      if (tRes.data) {
        setTest(tRes.data)
        setSecondsLeft(tRes.data.time_minutes * 60)
      }
      if (qRes.data) setQuestions(qRes.data as Question[])
      setLoading(false)
    })()
  }, [testId, session, navigate])

  useEffect(() => {
    if (!test || secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(id)
  }, [test, secondsLeft])

  useEffect(() => {
    if (test && secondsLeft === 0 && questions.length > 0) {
      toast.info("Vaqt tugadi")
      submit()
    }
  }, [secondsLeft, test, questions.length, submit])

  if (loading) return <div className="min-h-screen flex items-center justify-center">{t("common.loading")}</div>
  if (!test || questions.length === 0) return <div className="min-h-screen flex items-center justify-center">No questions</div>

  const q = questions[current]
  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / questions.length) * 100
  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, "0")
  const secs = (secondsLeft % 60).toString().padStart(2, "0")
  const timeWarning = secondsLeft < 60

  console.log("TEST:", test)
  console.log("SESSION:", session)

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-semibold truncate">{test.title}</h1>
            <p className="text-xs text-muted-foreground">{session!.firstName} {session!.lastName}</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-semibold ${timeWarning ? "bg-destructive/10 text-destructive animate-pulse" : "bg-accent text-accent-foreground"}`}>
            <Clock className="h-4 w-4" />
            {mins}:{secs}
          </div>
        </div>
        <div className="container mx-auto px-4 pb-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{t("student.question")} {current + 1} {t("student.of")} {questions.length}</span>
            <Progress value={progress} className="flex-1 h-1.5" />
            <span>{answeredCount}/{questions.length}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 md:p-8 shadow-soft">
              <p className="text-xs font-semibold text-primary mb-2">{t("student.question")} {current + 1}</p>
              <h2 className="text-xl font-semibold mb-6 leading-relaxed">{q.text}</h2>
              <RadioGroup
                value={answers[q.id]?.toString() ?? ""}
                onValueChange={(v) => setAnswers({ ...answers, [q.id]: parseInt(v) })}
                className="space-y-2"
              >
                {q.options.map((opt, i) => (
                  <Label
                    key={i}
                    htmlFor={`opt-${i}`}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-smooth hover:bg-accent/50 ${answers[q.id] === i ? "border-primary bg-accent/70" : "border-border"}`}
                  >
                    <RadioGroupItem value={i.toString()} id={`opt-${i}`} />
                    <span className="flex-1 font-normal">{opt}</span>
                  </Label>
                ))}
              </RadioGroup>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6 gap-3">
          <Button variant="outline" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> {t("common.back")}
          </Button>
          {current < questions.length - 1 ? (
            <Button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))} className="gap-2">
              {t("common.next")} <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="gap-2">{t("student.submit")}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("student.confirmSubmit")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {answeredCount}/{questions.length} savolga javob berdingiz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={submit}>{t("common.confirm")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <div className="mt-6 grid grid-cols-8 sm:grid-cols-10 gap-2">
          {questions.map((qq, i) => (
            <button
              key={qq.id}
              onClick={() => setCurrent(i)}
              className={`h-8 rounded-md text-xs font-medium transition-smooth ${i === current
                ? "bg-primary text-primary-foreground"
                : answers[qq.id] !== undefined
                  ? "bg-primary/60 text-accent-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

export default StudentTest
