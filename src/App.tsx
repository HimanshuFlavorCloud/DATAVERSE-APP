import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ChatPage } from "./pages/ChatPage";
import { LoginPage } from "./pages/LoginPage";
import { FullScreenLoader } from "./components/FullScreenLoader";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
