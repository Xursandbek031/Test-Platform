import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, FileText, BarChart3, Settings, LogOut, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LangSwitcher } from "@/components/LangSwitcher";

const TeacherSidebar = () => {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const items = [
    { to: "/teacher/tests", label: t("teacher.tests"), icon: FileText },
    { to: "/teacher/results", label: t("teacher.results"), icon: LayoutDashboard },
    { to: "/teacher/analytics", label: t("teacher.analytics"), icon: BarChart3 },
    { to: "/teacher/settings", label: t("teacher.settings"), icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-5 flex items-center gap-2 border-b">
          <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-lg">TestHub</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>{t("teacher.dashboard")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.to}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={it.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 ${isActive ? "bg-accent text-accent-foreground font-medium" : ""}`
                      }
                    >
                      <it.icon className="h-4 w-4" />
                      {!collapsed && <span>{it.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export const TeacherLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && !user) navigate("/teacher/login", { replace: true });
  }, [user, loading, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t("common.loading")}</div>;
  if (!user) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <TeacherSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                ← {t("student.backHome")}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <LangSwitcher />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                {t("common.logout")}
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
