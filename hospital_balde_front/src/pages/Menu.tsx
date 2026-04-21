interface MenuProps {
  onNavigate: (page: "citas" | "consultorios" | "consultas" | "procedimientos" ) => void;
  onLogout: () => void;
}

const opciones = [
  {
    id: "citas" as const,
    titulo: "Citas",
    desc: "Ver y gestionar citas médicas",
  },
  {
    id: "consultorios" as const,
    titulo: "Consultorios",
    desc: "Estado y disponibilidad de consultorios",
  },
  {
    id: "consultas" as const,
    titulo: "Consultas",
    desc: "Historial de consultas médicas",
  },
  {
    id: "procedimientos" as const,
    titulo: "Procedimientos",
    desc: "Detalles de procedimientos realizados",
  }, 
];

export default function Menu({ onNavigate, onLogout }: MenuProps) {
  return (
    <div className="menu-root">
      <header className="citas-header">
        <div className="header-left">
          <span className="header-title">Hospital Uppepiano</span>
        </div>
        <button className="btn-logout" onClick={onLogout}>
          Cerrar sesión
        </button>
      </header>

      <div className="menu-body">
        <h2 className="menu-title">¿Qué deseas consultar?</h2>
        <p className="menu-sub">Selecciona una opción para continuar</p>

        <div className="menu-grid">
          {opciones.map((op) => (
            <button
              key={op.id}
              className="menu-card"
              onClick={() => onNavigate(op.id)}
            >
              <span className="menu-card-title">{op.titulo}</span>
              <span className="menu-card-desc">{op.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
