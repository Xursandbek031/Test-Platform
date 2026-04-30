import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface Row {
  id: string;
  student_first_name: string;
  student_last_name: string;
  group_name: string | null;
  score_percent: number;
  correct_count: number;
  total_questions: number;
  created_at: string;
  tests: { title: string } | null;
}

const TeacherResults = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [testFilter, setTestFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("results")
        .select("id, student_first_name, student_last_name, group_name, score_percent, correct_count, total_questions, created_at, tests(title)")
        .order("created_at", { ascending: false });
      setRows((data as any) || []);
    })();
  }, [user]);

  const groups = useMemo(() => Array.from(new Set(rows.map((r) => r.group_name).filter(Boolean))) as string[], [rows]);
  const testTitles = useMemo(() => Array.from(new Set(rows.map((r) => r.tests?.title).filter(Boolean))) as string[], [rows]);

  const filtered = rows.filter((r) => {
    if (groupFilter !== "all" && r.group_name !== groupFilter) return false;
    if (testFilter !== "all" && r.tests?.title !== testFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${r.student_first_name} ${r.student_last_name}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t("teacher.noResults")}</TableCell></TableRow>
            ) : filtered.map((r) => {
              const score = Number(r.score_percent);
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default TeacherResults;
