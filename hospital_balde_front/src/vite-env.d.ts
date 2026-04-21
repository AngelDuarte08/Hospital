/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Solo si el front y el API están en orígenes distintos (p. ej. producción). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
