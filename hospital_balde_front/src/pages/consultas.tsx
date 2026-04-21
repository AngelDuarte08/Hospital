import { useCallback, useEffect, useState } from "react";
import jsPDF from "jspdf";
import { apiUrl } from "../api";

interface Consulta {
  id: number;
  id_paciente: number;
  id_doctor: number;
  id_consultorio: number;
  fecha_hora: string;
  motivo: string;
  diagnostico: string;
  tratamiento: string;
  costo: number;
  notas_adicionales: string;
}

interface Receta {
  medicamentos: string;
  indicaciones: string;
}

interface ConsultasProps {
  token: string;
  onLogout: () => void;
  onBack: () => void;
}

export default function Consultas({ token, onLogout, onBack }: ConsultasProps) {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Consulta>>({});
  const [showRecetaForm, setShowRecetaForm] = useState<number | null>(null);
  const [recetaData, setRecetaData] = useState<Receta>({ medicamentos: "", indicaciones: "" });

  const fetchConsultas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl("/api/query/consultas"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      const data = await res.json();
      setConsultas(data.data || []);
    } catch {
      setError("Error al cargar las consultas");
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    fetchConsultas();
  }, [fetchConsultas]);

  const formatFecha = (fecha: string) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const crearConsulta = async () => {
    if (
      !formData.id_paciente ||
      !formData.id_doctor ||
      !formData.id_consultorio ||
      !formData.fecha_hora ||
      !formData.motivo ||
      !formData.diagnostico ||
      !formData.tratamiento ||
      !formData.costo
    ) {
      setError("Completa todos los campos obligatorios");
      return;
    }

    try {
      const res = await fetch(apiUrl("/api/query/consultas"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({});
        await fetchConsultas();
      } else {
        setError("No se pudo crear la consulta");
      }
    } catch {
      setError("Error al crear consulta");
    }
  };

  const borrarConsulta = (id: number) => {
    if (!window.confirm("¿Eliminar esta consulta de la vista?")) return;
    setConsultas((prev) => prev.filter((c) => c.id !== id));
  };

  const generarRecetaPDF = (consulta: Consulta, receta: Receta) => {
    const doc = new jsPDF();
    doc.text("Receta Médica", 20, 20);
    doc.text(`Paciente ID: ${consulta.id_paciente}`, 20, 40);
    doc.text(`Doctor ID: ${consulta.id_doctor}`, 20, 50);
    doc.text(`Fecha: ${formatFecha(consulta.fecha_hora)}`, 20, 60);
    doc.text("Medicamentos:", 20, 80);
    doc.text(receta.medicamentos, 30, 90);
    doc.text("Indicaciones:", 20, 110);
    doc.text(receta.indicaciones, 30, 120);
    doc.save(`receta_consulta_${consulta.id}.pdf`);
  };

  return (
    <div className="consultas-root">
      {/* Modal de nueva consulta */}
      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Nueva Consulta</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await crearConsulta();
              }}
            >
              <input
                type="number"
                placeholder="ID Paciente"
                value={formData.id_paciente ?? ""}
                onChange={(e) => setFormData({ ...formData, id_paciente: Number(e.target.value) })}
                required
              />
              <input
                type="number"
                placeholder="ID Doctor"
                value={formData.id_doctor ?? ""}
                onChange={(e) => setFormData({ ...formData, id_doctor: Number(e.target.value) })}
                required
              />
              <input
                type="number"
                placeholder="ID Consultorio"
                value={formData.id_consultorio ?? ""}
                onChange={(e) => setFormData({ ...formData, id_consultorio: Number(e.target.value) })}
                required
              />
              <input
                type="datetime-local"
                placeholder="Fecha y Hora"
                value={formData.fecha_hora ?? ""}
                onChange={(e) => setFormData({ ...formData, fecha_hora: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Motivo"
                value={formData.motivo ?? ""}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Diagnóstico"
                value={formData.diagnostico ?? ""}
                onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Tratamiento"
                value={formData.tratamiento ?? ""}
                onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Costo"
                value={formData.costo ?? ""}
                onChange={(e) => setFormData({ ...formData, costo: Number(e.target.value) })}
                required
              />
              <input
                type="text"
                placeholder="Notas adicionales (opcional)"
                value={formData.notas_adicionales ?? ""}
                onChange={(e) => setFormData({ ...formData, notas_adicionales: e.target.value })}
              />
              <div className="modal-actions">
                <button type="submit">Crear</button>
                <button type="button" onClick={() => { setShowForm(false); setFormData({}); }}>Cancelar</button>
              </div>
              {error && <div className="state-msg error">⚠ {error}</div>}
            </form>
          </div>
        </div>
      )}
      <header className="consultas-header">
        <div className="header-left">
          <button className="btn-back" onClick={onBack}>← Menú</button>
          <span className="brand-cross small">✚</span>
          <span className="header-title">Consultas Médicas</span>
        </div>
        <div className="header-right">
          <span className="header-count">{consultas.length} consultas</span>
          <button className="btn-refresh" onClick={fetchConsultas}>↻ Actualizar</button>
          <button className="btn-add" onClick={() => setShowForm(true)}>＋ Nueva consulta</button>
          <button className="btn-logout" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </header>

      {/* Modal de receta */}
      {showRecetaForm !== null && (
        <div className="modal">
          <div className="modal-content">
            <h3>Receta para consulta #{showRecetaForm}</h3>
            <textarea placeholder="Medicamentos"
              value={recetaData.medicamentos}
              onChange={(e) => setRecetaData({ ...recetaData, medicamentos: e.target.value })}
            />
            <textarea placeholder="Indicaciones"
              value={recetaData.indicaciones}
              onChange={(e) => setRecetaData({ ...recetaData, indicaciones: e.target.value })}
            />
            <div className="modal-actions">
              <button onClick={() => {
                const consulta = consultas.find(c => c.id === showRecetaForm);
                if (consulta) generarRecetaPDF(consulta, recetaData);
                setShowRecetaForm(null);
                setRecetaData({ medicamentos: "", indicaciones: "" });
              }}>📄 Generar PDF</button>
              <button onClick={() => window.print()}>🖨 Imprimir</button>
              <button onClick={() => setShowRecetaForm(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="consultas-content">
        {loading && <div className="state-msg">Cargando consultas...</div>}
        {error && <div className="state-msg error">⚠ {error}</div>}
        {!loading && !error && consultas.length === 0 && (
          <div className="state-msg">No se encontraron consultas</div>
        )}

        {!loading && !error && consultas.length > 0 && (
          <div className="table-wrapper">
            <table className="consultas-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Paciente</th>
                  <th>Doctor</th>
                  <th>Consultorio</th>
                  <th>Motivo</th>
                  <th>Diagnóstico</th>
                  <th>Tratamiento</th>
                  <th>Costo</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {consultas.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>{formatFecha(c.fecha_hora)}</td>
                    <td>Pac. {c.id_paciente}</td>
                    <td>Dr. {c.id_doctor}</td>
                    <td>Cons. {c.id_consultorio}</td>
                    <td>{c.motivo || "—"}</td>
                    <td>{c.diagnostico || "—"}</td>
                    <td>{c.tratamiento || "—"}</td>
                    <td>${c.costo || 0}</td>
                    <td>{c.notas_adicionales || "—"}</td>
                    <td>
                      <button onClick={() => setShowRecetaForm(c.id)}>Receta Medica</button>
                      <button className="btn-delete" onClick={() => borrarConsulta(c.id)}>🗑</button>
                    </td>
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
