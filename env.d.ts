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
