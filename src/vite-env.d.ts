/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Optional absolute base (e.g. https://image-space-ten.vercel.app). Empty = same-origin /api/generate */
    readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}