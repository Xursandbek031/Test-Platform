import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import StudentStart from "./pages/student/StudentStart";
import StudentTest from "./pages/student/StudentTest";
import StudentResult from "./pages/student/StudentResult";
import TeacherLogin from "./pages/teacher/TeacherLogin";
import { TeacherLayout } from "./layouts/TeacherLayout";
import TeacherTests from "./pages/teacher/TeacherTests";
import TeacherTestEditor from "./pages/teacher/TeacherTestEditor";
import TeacherResults from "./pages/teacher/TeacherResults";
import TeacherAnalytics from "./pages/teacher/TeacherAnalytics";
import TeacherSettings from "./pages/teacher/TeacherSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/student" element={<StudentStart />} />
          <Route path="/student/test/:testId" element={<StudentTest />} />
          <Route path="/student/result/:resultId" element={<StudentResult />} />
          <Route path="/teacher/login" element={<TeacherLogin />} />
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<Navigate to="tests" replace />} />
            <Route path="tests" element={<TeacherTests />} />
            <Route path="tests/:id" element={<TeacherTestEditor />} />
            <Route path="results" element={<TeacherResults />} />
            <Route path="analytics" element={<TeacherAnalytics />} />
            <Route path="settings" element={<TeacherSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
