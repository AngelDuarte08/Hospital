import { useState } from "react";
import Login from "./pages/Login";
import Menu from "./pages/Menu";
import Citas from "./pages/Citas";
import Consultorios from "./pages/Consultorios";
import Consultas from "./pages/consultas";
import Procedimientos from "./pages/procedimientos";
import "./App.css";

type Page = "menu" | "citas" | "consultorios" | "consultas" | "procedimientos";

export default function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [page, setPage] = useState<Page>("menu");

  const handleLogin = (t: string) => {
    setToken(t);
    setPage("menu");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setPage("menu");
  };

  if (!token) return <Login onLogin={handleLogin} />;

  if (page === "menu")
    return <Menu onNavigate={setPage} onLogout={handleLogout} />;

  if (page === "citas")
    return (
      <Citas
        token={token}
        onLogout={handleLogout}
        onBack={() => setPage("menu")}
      />
    );

  if (page === "consultas")
    return (
      <Consultas
        token={token}
        onLogout={handleLogout}
        onBack={() => setPage("menu")}
      />
    );

  if (page === "procedimientos")
    return (
      <Procedimientos
        token={token}
        onLogout={handleLogout}
        onBack={() => setPage("menu")}
      />
    );

  if (page === "consultorios")
    return (
      <Consultorios
        token={token}
        onLogout={handleLogout}
        onBack={() => setPage("menu")}
      />
    );
}
