import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Trophy, TrendingDown, Activity, Users } from "lucide-react";

interface Row { score_percent: number; student_first_name: string; student_last_name: string; tests: { title: string } | null; }

const TeacherAnalytics = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("results")
        .select("score_percent, student_first_name, student_last_name, tests(title)");
      setRows((data as any) || []);
    })();
  }, [user]);

  const total = rows.length;
  const avg = total > 0 ? rows.reduce((s, r) => s + Number(r.score_percent), 0) / total : 0;
  const sorted = [...rows].sort((a, b) => Number(b.score_percent) - Number(a.score_percent));
  const top = sorted.slice(0, 5).map((r) => ({ name: `${r.student_first_name} ${r.student_last_name[0]}.`, score: Number(r.score_percent) }));
  const low = sorted.slice(-5).reverse().map((r) => ({ name: `${r.student_first_name} ${r.student_last_name[0]}.`, score: Number(r.score_percent) }));

  const buckets = [
    { name: "0-40%", value: rows.filter((r) => Number(r.score_percent) < 40).length, color: "hsl(var(--destructive))" },
    { name: "40-60%", value: rows.filter((r) => Number(r.score_percent) >= 40 && Number(r.score_percent) < 60).length, color: "hsl(var(--warning))" },
    { name: "60-80%", value: rows.filter((r) => Number(r.score_percent) >= 60 && Number(r.score_percent) < 80).length, color: "hsl(var(--primary))" },
    { name: "80-100%", value: rows.filter((r) => Number(r.score_percent) >= 80).length, color: "hsl(var(--success))" },
  ];

  const stats = [
    { label: t("teacher.totalAttempts"), value: total, icon: Users, color: "text-primary" },
    { label: t("teacher.avgScore"), value: `${avg.toFixed(1)}%`, icon: Activity, color: "text-success" },
    { label: t("teacher.topScores"), value: sorted[0] ? `${Number(sorted[0].score_percent).toFixed(0)}%` : "—", icon: Trophy, color: "text-warning" },
    { label: t("teacher.lowScores"), value: sorted[sorted.length - 1] ? `${Number(sorted[sorted.length - 1].score_percent).toFixed(0)}%` : "—", icon: TrendingDown, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("teacher.analytics")}</h1>
        <p className="text-sm text-muted-foreground">Natijalar tahlili</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">{t("teacher.topScores")}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={top}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="score" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">{t("teacher.lowScores")}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={low}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="score" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-4">Natijalar taqsimoti</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={buckets} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {buckets.map((b, i) => <Cell key={i} fill={b.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default TeacherAnalytics;
