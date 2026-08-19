// Minimal local replacement for the `defineTool` / `defineMcp` helpers that
// used to come from `@lovable.dev/mcp-js`. That package (and the Vite plugin
// that consumed these definitions to generate supabase/functions/mcp/index.ts)
// has been removed as part of the Lovable migration.
//
// These are now just typed identity helpers — they exist so the four tool
// modules keep the same authoring shape (name/title/description/inputSchema/
// annotations/handler) and stay type-checked against their Zod input schemas.
// The actual MCP wire server is hand-written directly in
// supabase/functions/mcp/index.ts using @modelcontextprotocol/sdk, since Deno
// edge functions can't import this npm package into the browser bundle (nor
// vice versa).
import type { z } from "zod";

export type ToolInputShape = Record<string, z.ZodTypeAny>;

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  idempotentHint?: boolean;
  destructiveHint?: boolean;
  openWorldHint?: boolean;
}

export type ToolContent = { type: "text"; text: string };

export interface ToolResult {
  content: ToolContent[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export interface ToolDefinition<Shape extends ToolInputShape = ToolInputShape> {
  name: string;
  title: string;
  description: string;
  inputSchema: Shape;
  annotations?: ToolAnnotations;
  handler: (args: { [K in keyof Shape]: z.infer<Shape[K]> }) => ToolResult;
}

/** Identity helper — keeps tool definitions typed against their own input schema. */
export function defineTool<Shape extends ToolInputShape>(
  tool: ToolDefinition<Shape>,
): ToolDefinition<Shape> {
  return tool;
}

export interface McpDefinition {
  name: string;
  title: string;
  version: string;
  instructions: string;
  tools: ToolDefinition<any>[];
}

/** Identity helper — mirrors the shape of the old `defineMcp` config object. */
export function defineMcp(config: McpDefinition): McpDefinition {
  return config;
}
