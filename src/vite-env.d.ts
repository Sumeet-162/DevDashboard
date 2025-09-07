/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GITHUB_CLIENT_ID: string
  // Note: VITE_GITHUB_CLIENT_SECRET removed for security - should only be on backend
  readonly VITE_SERVER_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global declaration for lord-icon custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': {
        src: string;
        trigger?: string;
        delay?: number | string;
        state?: string;
        style?: React.CSSProperties;
        colors?: string;
        stroke?: number;
        className?: string;
      };
    }
  }
}
