import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../api";

interface Cita {
  id: number;
  fecha: string;
  hora: string;
  paciente_id: number;
  doctor_id: number;
  estado: string;
  notas: string;
  tipo: string;
  pre_cita_id: number;
  created_at: string;
}

interface CitasProps {
  token: string;
  onLogout: () => void;
  onBack: () => void;
}

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "#fadc18ff",
  confirmada: "#33ff00ff",
  cancelada: "#ff0000ff",
  completada: "#6366f1",
};

export default function Citas({ token, onLogout, onBack }: CitasProps) {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  //no quiten esto que si no se rompe
  const [search] = useState("");
  const [filtroEstado] = useState("todos");

  const fetchCitas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/query/citas"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      const data = await res.json();
      setCitas(data.data || []);
    } catch {
      setError("Error al cargar las citas");
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  const formatFecha = (fecha: string) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatHora = (hora: string) => {
    if (!hora) return "—";
    return hora.slice(0, 5);
  };

  const filtered = citas.filter((c) => {
    const matchEstado = filtroEstado === "todos" || c.estado === filtroEstado;
    const matchSearch =
      search === "" ||
      String(c.paciente_id).includes(search) ||
      (c.notas || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.tipo || "").toLowerCase().includes(search.toLowerCase());
    return matchEstado && matchSearch;
  });

  return (
    <div className="citas-root">
      <header className="citas-header">
        <div className="header-left">
          <button className="btn-back" onClick={onBack}>← Menú</button>
          <span className="brand-cross small">✚</span>
          <span className="header-title">Citas Doctores</span>
        </div>
        <div className="header-right">
          <span className="header-count">{filtered.length} citas</span>
          <button className="btn-refresh" onClick={fetchCitas}>↻ Actualizar</button>
          <button className="btn-logout" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </header>

      <div className="citas-content">
        {loading && <div className="state-msg">Cargando citas...</div>}
        {error && <div className="state-msg error">⚠ {error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="state-msg">No se encontraron citas</div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="table-wrapper">
            <table className="citas-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Doctor</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cita) => (
                  <tr key={cita.id}>
                    <td className="td-id">#{cita.id}</td>
                    <td>{formatFecha(cita.fecha)}</td>
                    <td className="td-hora">{formatHora(cita.hora)}</td>
                    <td>Pac. {cita.paciente_id}</td>
                    <td>Dr. {cita.doctor_id}</td>
                    <td className="td-tipo">{cita.tipo || "—"}</td>
                    <td>
                      <span
                        className="badge-estado"
                        style={{
                          background: (ESTADO_COLOR[cita.estado] || "#64748b") + "22",
                          color: ESTADO_COLOR[cita.estado] || "#64748b",
                          borderColor: ESTADO_COLOR[cita.estado] || "#64748b",
                        }}
                      >
                        {cita.estado || "sin estado"}
                      </span>
                    </td>
                    <td className="td-notas">{cita.notas || "—"}</td>
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
