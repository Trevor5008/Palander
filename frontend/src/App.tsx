import { Route, Routes, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DailyRedirect } from "./components/DailyRedirect";
import {
    isCalendarPath,
    isDailyWorkspacePath,
    LAYOUT_HEADER_OFFSET,
} from "./constants/layout";
import { useLayoutWidth } from "./hooks/useLayoutWidth";
import { CalendarView } from "./pages/CalendarView";
import { WeeklyView } from "./pages/WeeklyView";
import { DailyView } from "./pages/DailyView";
import { LoginView } from "./pages/LoginView";

function AppShell({ children }: { children: React.ReactNode }) {
    const { pathname } = useLocation();
    const widthClass = useLayoutWidth();
    const isCalendar = isCalendarPath(pathname);
    const isDailyWorkspace = isDailyWorkspacePath(pathname);
    const useViewportHeight = isCalendar || isDailyWorkspace;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <Header widthClass={widthClass} />
            <main
                className={`mx-auto w-full ${widthClass} ${useViewportHeight
                    ? "flex flex-col px-6 pb-4"
                    : "max-h-screen overflow-hidden px-6 py-8"
                    }`}
                style={useViewportHeight ? { height: `calc(100dvh - ${LAYOUT_HEADER_OFFSET})` } : undefined}
            >
                {children}
            </main>
        </div>
    );
}

export function App() {
    return (
        <AppShell>
            <Routes>
                <Route path="/login" element={<LoginView />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<DailyView />} />
                    <Route path="/daily" element={<DailyRedirect />} />
                    <Route path="/weekly" element={<WeeklyView />} />
                    <Route path="/monthly" element={<CalendarView />} />
                </Route>
            </Routes>
        </AppShell>
    );
}
