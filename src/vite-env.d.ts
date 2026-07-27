/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Optional absolute base (e.g. https://image-space-ten.vercel.app). Empty = same-origin /api/generate */
    readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module 'framer-motion-3d' {
    export * from 'framer-motion-3d/dist/index';
    import { ComponentType } from 'react';
    export const motion: Record<string, ComponentType<any>>;
}