import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "../api";

interface Consultorio {
  id_consultorio: number;
  numero_consultorio: number;
  piso: number;
  status: string;
  area: string;
}

interface ConsultoriosProps {
  token: string;
  onBack: () => void;
  onLogout: () => void;
}

export default function Consultorios({ token, onBack, onLogout }: ConsultoriosProps) {
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchConsultorios = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/query/consultorios"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      const data = await res.json();
      setConsultorios(data.data || []);
    } catch {
      setError("Error al cargar los consultorios");
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    fetchConsultorios();
  }, [fetchConsultorios]);

  const disponibles = consultorios.filter((c) => c.status === "DISPONIBLE").length;
  const ocupados = consultorios.filter((c) => c.status === "OCUPADO").length;

  return (
    <div className="citas-root">
      <header className="citas-header">
        <div className="header-left">
          <button className="btn-back" onClick={onBack}>← Menú</button>
          <span className="brand-cross small">✚</span>
          <span className="header-title">Consultorios</span>
        </div>
        <div className="header-right">
          <span className="header-count disponible">✓ {disponibles} disponibles</span>
          <span className="header-count ocupado">✗ {ocupados} ocupados</span>
          <button className="btn-refresh" onClick={fetchConsultorios}>↻ Actualizar</button>
          <button className="btn-logout" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </header>

      <div className="citas-content" style={{ paddingTop: "1.5rem" }}>
        {loading && <div className="state-msg">Cargando consultorios...</div>}
        {error && <div className="state-msg error">⚠ {error}</div>}

        {!loading && !error && (
          <div className="consultorios-grid">
            {consultorios.map((c) => (
              <div
                key={c.id_consultorio}
                className={`consultorio-card ${c.status === "DISPONIBLE" ? "card-disponible" : "card-ocupado"}`}
              >
                <div className="card-header-row">
                  <span className="card-numero">Consultorio {c.numero_consultorio}</span>
                  <span className={`badge-status ${c.status === "DISPONIBLE" ? "badge-disponible" : "badge-ocupado"}`}>
                    {c.status}
                  </span>
                </div>
                <div className="card-area">{c.area}</div>
                <div className="card-piso">Piso {c.piso}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
