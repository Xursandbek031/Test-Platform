import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const TeacherSettings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [defaultMinutes, setDefaultMinutes] = useState(20);
  const [newPassword, setNewPassword] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [newGroup, setNewGroup] = useState("");

  const loadGroups = async () => {
    if (!user) return;
    const { data } = await supabase.from("groups").select("id, name").eq("owner_id", user.id).order("name");
    setGroups(data || []);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("full_name, default_test_minutes").eq("id", user.id).single();
      if (data) {
        setFullName(data.full_name || "");
        setDefaultMinutes(data.default_test_minutes || 20);
      }
      loadGroups();
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: fullName, default_test_minutes: defaultMinutes }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Saqlandi");
  };

  const updatePw = async () => {
    if (newPassword.length < 6) return toast.error("Kamida 6 ta belgi");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return toast.error(error.message);
    toast.success("Parol yangilandi");
    setNewPassword("");
  };

  const addGroup = async () => {
    if (!user || !newGroup.trim()) return;
    const { error } = await supabase.from("groups").insert({ owner_id: user.id, name: newGroup.trim() });
    if (error) return toast.error(error.message);
    setNewGroup("");
    loadGroups();
  };

  const removeGroup = async (id: string) => {
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) return toast.error(error.message);
    loadGroups();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("teacher.settings")}</h1>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">{t("teacher.profile")}</h2>
        <div>
          <Label>{t("teacher.fullName")}</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
        </div>
        <div>
          <Label>{t("common.email")}</Label>
          <Input value={user?.email || ""} disabled />
        </div>
        <div>
          <Label>{t("teacher.defaultTime")}</Label>
          <Input type="number" min={1} max={300} value={defaultMinutes} onChange={(e) => setDefaultMinutes(parseInt(e.target.value) || 20)} />
        </div>
        <Button onClick={saveProfile}>{t("common.save")}</Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">{t("teacher.updatePassword")}</h2>
        <div>
          <Label>{t("teacher.newPassword")}</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} maxLength={72} />
        </div>
        <Button onClick={updatePw} disabled={!newPassword}>{t("common.save")}</Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">{t("teacher.groups")}</h2>
        <div className="flex gap-2">
          <Input placeholder={t("teacher.groupName")} value={newGroup} onChange={(e) => setNewGroup(e.target.value)} maxLength={50} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGroup())} />
          <Button onClick={addGroup} className="gap-2"><Plus className="h-4 w-4" /> {t("common.create")}</Button>
        </div>
        <div className="space-y-2">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hozircha guruhlar yo'q</p>
          ) : groups.map((g) => (
            <div key={g.id} className="flex items-center justify-between px-3 py-2 rounded-lg border bg-muted/30">
              <span>{g.name}</span>
              <Button variant="ghost" size="sm" onClick={() => removeGroup(g.id)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TeacherSettings;
