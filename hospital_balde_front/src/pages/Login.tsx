import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl, jsonHeaders } from "../api";

interface LoginProps {
  onLogin: (token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [nombre, setNombre] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceppLoading, setFaceppLoading] = useState(false);
  const [faceppError, setFaceppError] = useState("");
  const [faceppSummary, setFaceppSummary] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const el = videoRef.current;
    if (el) el.srcObject = null;
    setCameraOn(false);
    setVideoReady(false);
    setFaceppSummary(null);
    setFaceppError("");
  }, []);

  const startCamera = async () => {
    setCameraError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Tu navegador no expone la cámara (usa HTTPS o localhost, o actualiza el navegador)."
        );
        return;
      }
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      const el = videoRef.current;
      if (el) {
        el.srcObject = stream;
        await el.play().catch(() => {});
        const markReady = () => {
          if (el.videoWidth > 0 && el.videoHeight > 0) setVideoReady(true);
        };
        markReady();
        requestAnimationFrame(() => {
          markReady();
          requestAnimationFrame(markReady);
        });
      }
      setCameraOn(true);
    } catch (e) {
      const err = e as DOMException;
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          "Permiso de cámara denegado. Pulsa el icono del candado en la barra de direcciones y permite la cámara para este sitio."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No se encontró ninguna cámara conectada.");
      } else {
        setCameraError("No se pudo activar la cámara.");
      }
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  const captureFrameBase64 = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraOn) return null;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;
    const maxW = 960;
    let cw = w;
    let ch = h;
    if (w > maxW) {
      cw = maxW;
      ch = Math.round((h * maxW) / w);
    }
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, cw, ch);
    return canvas.toDataURL("image/jpeg", 0.82);
  };

  const waitForVideoDimensions = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video) {
        resolve(false);
        return;
      }
      let n = 0;
      const tick = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          resolve(true);
          return;
        }
        n += 1;
        if (n > 75) {
          resolve(false);
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  const analyzeWithFacePlusPlus = async () => {
    setFaceppError("");
    setFaceppSummary(null);
    if (!cameraOn || !videoReady) {
      setFaceppError("Espera a que la vista previa muestre tu rostro y vuelve a intentar.");
      return;
    }
    const dimsOk = await waitForVideoDimensions();
    if (!dimsOk) {
      setFaceppError(
        "La cámara aún no tiene imagen. Espera 1–2 s con la cámara activa e inténtalo otra vez."
      );
      return;
    }
    const b64 = captureFrameBase64();
    if (!b64) {
      setFaceppError("No se pudo capturar el fotograma. Comprueba que la cámara esté activa.");
      return;
    }
    setFaceppLoading(true);
    try {
      const res = await fetch(apiUrl("/api/face/detect"), {
        method: "POST",
        headers: { ...jsonHeaders },
        body: JSON.stringify({ image_base64: b64 }),
      });
      const text = await res.text();
      let data: {
        error_message?: string;
        faces?: Array<{
          attributes?: {
            age?: { value?: number };
            gender?: { value?: string };
            smiling?: { value?: number };
          };
        }>;
      } = {};
      try {
        data = text ? (JSON.parse(text) as typeof data) : {};
      } catch {
        setFaceppError("Respuesta inválida del servidor");
        return;
      }
      const errMsg = (d: typeof data & { message?: string; error?: string }) =>
        d.error_message || d.message || d.error;

      if (!res.ok) {
        if (res.status === 503) {
          setFaceppError(
            errMsg(data) ||
              "El servidor no tiene configuradas las claves de Face++. Revisa el .env del backend."
          );
          return;
        }
        if (res.status === 429) {
          setFaceppError(
            errMsg(data) || "Demasiados análisis. Espera unos minutos."
          );
          return;
        }
        setFaceppError(errMsg(data) || `Error del servidor (${res.status})`);
        return;
      }
      if (data.error_message) {
        setFaceppError(data.error_message);
        return;
      }
      const faces = data.faces ?? [];
      const n = faces.length;
      if (n === 0) {
        setFaceppSummary("Face++ no detectó ningún rostro en la imagen.");
        return;
      }
      const f = faces[0];
      const age = f.attributes?.age?.value;
      const gender = f.attributes?.gender?.value;
      const smile = f.attributes?.smiling?.value;
      const parts = [`Rostros detectados: ${n}`];
      if (age != null) parts.push(`Edad estimada: ${age}`);
      if (gender) parts.push(`Género: ${gender}`);
      if (smile != null) {
        const pct = smile <= 1 ? smile * 100 : smile;
        parts.push(`Sonrisa: ${pct.toFixed(0)}%`);
      }
      setFaceppSummary(parts.join(" · "));
    } catch {
      setFaceppError("No se pudo contactar al servidor o a Face++.");
    } finally {
      setFaceppLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(apiUrl("/api/login"), {
        method: "POST",
        headers: { ...jsonHeaders },
        body: JSON.stringify({ username: usuario, password: contrasena }),
      });

      const text = await res.text();
      let data: { message?: string; token?: string } = {};
      try {
        data = text ? (JSON.parse(text) as typeof data) : {};
      } catch {
        setError("Respuesta inválida del servidor");
        return;
      }

      if (!res.ok) {
        const msg =
          data.message ||
          (res.status === 429
            ? "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
            : "Error al iniciar sesión");
        setError(msg);
      } else if (data.token) {
        localStorage.setItem("token", data.token);
        onLogin(data.token);
      } else {
        setError("El servidor no devolvió un token");
      }
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(apiUrl("/api/register-doctor"), {
        method: "POST",
        headers: { ...jsonHeaders },
        body: JSON.stringify({
          username: usuario,
          password: contrasena,
          nombre,
          correo: usuario + '@hospital.com', // campo requerido por la DB
          especialidad_id: null,
        }),
      });

      const text = await res.text();
      let data: { message?: string } = {};
      try {
        data = text ? (JSON.parse(text) as typeof data) : {};
      } catch {
        setError("Respuesta inválida del servidor");
        return;
      }

      if (!res.ok) {
        setError(
          data.message ||
            (res.status === 429
              ? "Demasiados registros desde esta conexión. Espera e inténtalo más tarde."
              : "No se pudo registrar")
        );
        return;
      }

      setSuccess("Cuenta creada. Ya puedes iniciar sesión.");
      setMode("login");
      setContrasena("");
      setNombre("");
      setEspecialidad("");
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-left">
        <div className="brand">
          <span className="brand-cross"></span>
          <span className="brand-name">Hospital<br />Uppepiano</span>
        </div>
        <p className="brand-tagline">Dotores</p>
      </div>

      <div className="login-right">
        <div className="login-form login-form-wide">
          <section className="security-note" aria-label="Privacidad">
            <p className="security-note-text">
              <strong>Privacidad:</strong> usuario y contraseña viajan cifrados
              en HTTPS en producción. Las claves de Face++ y la base de datos
              solo existen en el servidor; no se guardan en el navegador.
            </p>
          </section>

          <section className="camera-panel" aria-label="Cámara">
            <div className="camera-panel-header">
              <span className="camera-panel-title">Cámara</span>
              {cameraOn ? (
                <span className="camera-status camera-status-on">Activa</span>
              ) : (
                <span className="camera-status camera-status-off">Apagada</span>
              )}
            </div>
            <p className="camera-panel-desc">
              Con la cámara activa, <strong>Analizar con Face++</strong> envía
              solo un fotograma a <em>tu</em> servidor; el servidor llama a
              Face++ con credenciales que no salen del backend.
            </p>
            <div className="camera-preview-wrap">
              <video
                ref={videoRef}
                className="camera-preview-video"
                playsInline
                muted
                autoPlay
                onLoadedMetadata={() => setVideoReady(true)}
                onLoadedData={() => setVideoReady(true)}
                onPlaying={() => setVideoReady(true)}
                onEmptied={() => setVideoReady(false)}
              />
              {!cameraOn && (
                <div className="camera-placeholder">Vista previa de la cámara</div>
              )}
            </div>
            <canvas ref={canvasRef} className="camera-canvas-hidden" aria-hidden />
            {cameraError && <p className="camera-error">{cameraError}</p>}
            {faceppError && <p className="camera-error">{faceppError}</p>}
            {faceppSummary && <p className="facepp-summary">{faceppSummary}</p>}
            <div className="camera-actions">
              <button
                type="button"
                className="btn-camera"
                onClick={startCamera}
              >
                Permitir y usar cámara
              </button>
              <button
                type="button"
                className="btn-camera-secondary"
                onClick={stopCamera}
                disabled={!cameraOn}
              >
                Apagar cámara
              </button>
            </div>
            <button
              type="button"
              className="btn-facepp"
              onClick={analyzeWithFacePlusPlus}
              disabled={!cameraOn || !videoReady || faceppLoading}
            >
              {faceppLoading
                ? "Analizando con Face++…"
                : !cameraOn || !videoReady
                  ? "Analizar con Face++ (activa la cámara antes)"
                  : "Analizar con Face++"}
            </button>
          </section>

          <div className="login-mode-tabs" role="tablist">
            <button
              type="button"
              className={`login-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={`login-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => {
                setMode("register");
                setError("");
                setSuccess("");
              }}
            >
              Registrar
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin}>
              <h2 className="form-title">Acceso médico</h2>
              <p className="form-sub">Ingresa tus credenciales para continuar</p>

              <div className="field">
                <label>Usuario</label>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Usuario"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="field">
                <label>Contraseña</label>
                <input
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && <p className="error-msg">{error}</p>}
              {success && <p className="success-msg">{success}</p>}

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? "Verificando..." : "Iniciar sesión"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <h2 className="form-title">Nuevo doctor</h2>
              <p className="form-sub">
                Completa los datos para crear tu cuenta de acceso.
              </p>

              <div className="field">
                <label>Nombre completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre y apellidos"
                  required
                  autoComplete="name"
                />
              </div>

              <div className="field">
                <label>Especialidad</label>
                <input
                  type="text"
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  placeholder="Ej. Medicina general"
                  required
                  autoComplete="organization-title"
                />
              </div>

              <div className="field">
                <label>Usuario</label>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Usuario para acceder"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="field">
                <label>Contraseña</label>
                <input
                  type="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
              </div>

              {error && <p className="error-msg">{error}</p>}
              {success && <p className="success-msg">{success}</p>}

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? "Registrando..." : "Crear cuenta"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
