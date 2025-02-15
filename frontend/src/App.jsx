// App.jsx
import React, { createContext, useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Components
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import AdminPanel from "./components/AdminPanel";
import WeekPlan from "./components/WeekPlan";
import ArticleSearch from "./components/ArticleSearch";

// Pages
import OnboardingPage from "./pages/OnboardingPage";
import ArticlePage from "./pages/ArticlePage";

// Criar o contexto do usuário
export const UserContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se existe usuário no localStorage ao iniciar
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Componente de proteção de rota
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/" />;
    }

    return children;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/articles"
            element={
              <ProtectedRoute>
                <ArticleSearch />
              </ProtectedRoute>
            }
          />

          <Route
            path="/article/:id"
            element={
              <ProtectedRoute>
                <ArticlePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/plan"
            element={
              <ProtectedRoute>
                <WeekPlan />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </UserContext.Provider>
  );
}

export default App;
