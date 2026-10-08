declare module "cloudflare:workers" {
  export const env: Record<string, any>;
  export interface ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
  }
}

declare module "./.openai/hosting.json" {
  const content: { d1?: string; r2?: string };
  export default content;
}

declare module "./scripts/execution-profile.mjs" {
  export function readExecutionProfile(): string;
}

declare module "./build/sites-vite-plugin" {
  export function sites(options?: { mockAuth?: boolean }): any;
}
