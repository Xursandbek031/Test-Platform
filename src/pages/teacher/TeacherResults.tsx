// import { useEffect, useMemo, useState } from "react";
// import { useTranslation } from "react-i18next";
// import { supabase } from "@/integrations/supabase/client";
// import { useAuth } from "@/hooks/useAuth";
// import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Search } from "lucide-react";

// interface Row {
//   id: string;
//   student_first_name: string;
//   student_last_name: string;
//   group_name: string | null;
//   score_percent: number;
//   correct_count: number;
//   total_questions: number;
//   created_at: string;
//   tests: { title: string } | null;
// }

// const TeacherResults = () => {
//   const { t } = useTranslation();
//   const { user } = useAuth();
//   const [rows, setRows] = useState<Row[]>([]);
//   const [search, setSearch] = useState("");
//   const [groupFilter, setGroupFilter] = useState("all");
//   const [testFilter, setTestFilter] = useState("all");

//   useEffect(() => {
//     if (!user) return;
//     (async () => {
//       const { data } = await supabase
//         .from("results")
//         .select("id, student_first_name, student_last_name, group_name, score_percent, correct_count, total_questions, created_at, tests(title)")
//         .order("created_at", { ascending: false });
//       setRows((data as any) || []);
//     })();
//   }, [user]);

//   const groups = useMemo(() => Array.from(new Set(rows.map((r) => r.group_name).filter(Boolean))) as string[], [rows]);
//   const testTitles = useMemo(() => Array.from(new Set(rows.map((r) => r.tests?.title).filter(Boolean))) as string[], [rows]);

//   const filtered = rows.filter((r) => {
//     if (groupFilter !== "all" && r.group_name !== groupFilter) return false;
//     if (testFilter !== "all" && r.tests?.title !== testFilter) return false;
//     if (search) {
//       const q = search.toLowerCase();
//       if (!`${r.student_first_name} ${r.student_last_name}`.toLowerCase().includes(q)) return false;
//     }
//     return true;
//   });

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold">{t("teacher.results")}</h1>
//         <p className="text-sm text-muted-foreground">{filtered.length} ta natija</p>
//       </div>

//       <Card className="p-4 grid md:grid-cols-3 gap-3">
//         <div className="relative">
//           <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
//           <Input placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
//         </div>
//         <Select value={groupFilter} onValueChange={setGroupFilter}>
//           <SelectTrigger><SelectValue placeholder={t("teacher.groups")} /></SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">Barcha guruhlar</SelectItem>
//             {groups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
//           </SelectContent>
//         </Select>
//         <Select value={testFilter} onValueChange={setTestFilter}>
//           <SelectTrigger><SelectValue placeholder={t("teacher.tests")} /></SelectTrigger>
//           <SelectContent>
//             <SelectItem value="all">Barcha testlar</SelectItem>
//             {testTitles.map((tt) => <SelectItem key={tt} value={tt}>{tt}</SelectItem>)}
//           </SelectContent>
//         </Select>
//       </Card>

//       <Card className="overflow-hidden">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>O'quvchi</TableHead>
//               <TableHead>{t("teacher.groups")}</TableHead>
//               <TableHead>Test</TableHead>
//               <TableHead className="text-right">Ball</TableHead>
//               <TableHead className="text-right">%</TableHead>
//               <TableHead>Sana</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {filtered.length === 0 ? (
//               <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t("teacher.noResults")}</TableCell></TableRow>
//             ) : filtered.map((r) => {
//               const score = Number(r.score_percent);
//               return (
//                 <TableRow key={r.id}>
//                   <TableCell className="font-medium">{r.student_first_name} {r.student_last_name}</TableCell>
//                   <TableCell>{r.group_name || "—"}</TableCell>
//                   <TableCell className="text-muted-foreground">{r.tests?.title || "—"}</TableCell>
//                   <TableCell className="text-right text-sm">{r.correct_count}/{r.total_questions}</TableCell>
//                   <TableCell className="text-right">
//                     <Badge variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"}>
//                       {score.toFixed(0)}%
//                     </Badge>
//                   </TableCell>
//                   <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
//                 </TableRow>
//               );
//             })}
//           </TableBody>
//         </Table>
//       </Card>
//     </div>
//   );
// };

// export default TeacherResults;




import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { CheckCircle2, Eye, MinusCircle, Search, XCircle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

interface AnswerLog {
  questionId: string
  questionText: string
  options: string[]
  selected: number | null
  correctIndex: number
  isCorrect: boolean
}

interface Row {
  id: string
  student_first_name: string
  student_last_name: string
  group_name: string | null
  score_percent: number
  correct_count: number
  total_questions: number
  created_at: string
  answers: AnswerLog[]
  time_taken_seconds: number | null
  tests: { title: string } | null
}

const TeacherResults = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [search, setSearch] = useState("")
  const [groupFilter, setGroupFilter] = useState("all")
  const [testFilter, setTestFilter] = useState("all")
  const [selected, setSelected] = useState<Row | null>(null)

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("results")
        .select("id, student_first_name, student_last_name, group_name, score_percent, correct_count, total_questions, created_at, answers, time_taken_seconds, tests(title)")
        .order("created_at", { ascending: false })
      setRows((data as any) || [])
    })()
  }, [user])

  const groups = useMemo(() => Array.from(new Set(rows.map((r) => r.group_name).filter(Boolean))) as string[], [rows])
  const testTitles = useMemo(() => Array.from(new Set(rows.map((r) => r.tests?.title).filter(Boolean))) as string[], [rows])

  const filtered = rows.filter((r) => {
    if (groupFilter !== "all" && r.group_name !== groupFilter) return false
    if (testFilter !== "all" && r.tests?.title !== testFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${r.student_first_name} ${r.student_last_name}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  const formatTime = (s: number | null) => {
    if (!s) return "—"
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}m ${sec}s`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("teacher.results")}</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} ta natija</p>
      </div>

      <Card className="p-4 grid md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger><SelectValue placeholder={t("teacher.groups")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha guruhlar</SelectItem>
            {groups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={testFilter} onValueChange={setTestFilter}>
          <SelectTrigger><SelectValue placeholder={t("teacher.tests")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha testlar</SelectItem>
            {testTitles.map((tt) => <SelectItem key={tt} value={tt}>{tt}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>O'quvchi</TableHead>
              <TableHead>{t("teacher.groups")}</TableHead>
              <TableHead>Test</TableHead>
              <TableHead className="text-right">Ball</TableHead>
              <TableHead className="text-right">%</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t("teacher.noResults")}</TableCell></TableRow>
            ) : filtered.map((r) => {
              const score = Number(r.score_percent)
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.student_first_name} {r.student_last_name}</TableCell>
                  <TableCell>{r.group_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.tests?.title || "—"}</TableCell>
                  <TableCell className="text-right text-sm">{r.correct_count}/{r.total_questions}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"}>
                      {score.toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(r)} className="gap-1">
                      <Eye className="h-4 w-4" /> Batafsil
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selected.student_first_name} {selected.student_last_name}
                </DialogTitle>
                <DialogDescription>
                  {selected.tests?.title || "—"} • {selected.group_name || "—"} • {new Date(selected.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-3 my-4">
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{Number(selected.score_percent).toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">{t("student.score")}</div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold">{selected.correct_count}/{selected.total_questions}</div>
                  <div className="text-xs text-muted-foreground">{t("student.correct")}</div>
                </Card>
                <Card className="p-3 text-center">
                  <div className="text-2xl font-bold">{formatTime(selected.time_taken_seconds)}</div>
                  <div className="text-xs text-muted-foreground">{t("student.timeLeft")}</div>
                </Card>
              </div>

              <h3 className="font-semibold text-sm mb-2">{t("student.reviewAnswers")}</h3>
              <div className="space-y-3">
                {(selected.answers || []).map((a, idx) => (
                  <Card key={a.questionId || idx} className="p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-xs font-semibold text-muted-foreground mt-1">{idx + 1}.</span>
                      <p className="flex-1 font-medium text-sm">{a.questionText}</p>
                      {a.selected === null
                        ? <MinusCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                        : a.isCorrect
                          ? <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                          : <XCircle className="h-5 w-5 text-destructive shrink-0" />}
                    </div>
                    <div className="space-y-1.5 ml-6">
                      {a.options.map((opt, i) => {
                        const isCorrect = i === a.correctIndex
                        const isSelected = i === a.selected
                        return (
                          <div
                            key={i}
                            className={`text-sm px-3 py-2 rounded-md ${isCorrect ? "bg-success/10 text-success-foreground border border-success/30 font-medium"
                              : isSelected ? "bg-destructive/10 text-destructive border border-destructive/30"
                                : "text-muted-foreground"
                              }`}
                          >
                            {opt}
                            {isSelected && !isCorrect && <span className="ml-2 text-xs">({t("student.yourAnswer")})</span>}
                            {isCorrect && <span className="ml-2 text-xs">✓ {t("student.correctAnswer")}</span>}
                          </div>
                        )
                      })}
                      {a.selected === null && (
                        <div className="text-xs text-muted-foreground italic">{t("student.notAnswered")}</div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TeacherResults
