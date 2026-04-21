import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../api";

interface Procedimiento {
  id_procedimientos: number;
  procedimiento: string;
  especialidad: string;
}

interface ProcedimientosProps {
  token: string;
  onLogout: () => void;
  onBack: () => void;
}

export default function Procedimientos({ token, onLogout, onBack }: ProcedimientosProps) {
  const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProcedimientos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/query/procedimientos"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      const data = await res.json();
      setProcedimientos(data.data || []);
    } catch {
      setError("Error al cargar los procedimientos");
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    fetchProcedimientos();
  }, [fetchProcedimientos]);

  return (
    <div className="procedimientos-root">
      <header className="procedimientos-header">
        <div className="header-left">
          <button className="btn-back" onClick={onBack}>← Menú</button>
          <span className="brand-cross small">✚</span>
          <span className="header-title">Procedimientos Médicos</span>
        </div>
        <div className="header-right">
          <span className="header-count">{procedimientos.length} procedimientos</span>
          <button className="btn-refresh" onClick={fetchProcedimientos}>↻ Actualizar</button>
          <button className="btn-logout" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </header>

      <div className="procedimientos-content">
        {loading && <div className="state-msg">Cargando procedimientos...</div>}
        {error && <div className="state-msg error">⚠ {error}</div>}
        {!loading && !error && procedimientos.length === 0 && (
          <div className="state-msg">No se encontraron procedimientos</div>
        )}

        {!loading && !error && procedimientos.length > 0 && (
          <div className="table-wrapper">
            <table className="procedimientos-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Procedimiento</th>
                  <th>Especialidad</th>
                </tr>
              </thead>
              <tbody>
                {procedimientos.map((p) => (
                  <tr key={p.id_procedimientos}>
                    <td className="td-id">#{p.id_procedimientos}</td>
                    <td>{p.procedimiento || "—"}</td>
                    <td>{p.especialidad || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
