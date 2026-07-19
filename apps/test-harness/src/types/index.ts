import { z } from 'zod';

export const SeedSchema = z.object({
  schema_version: z.string(),
  organ: z.string(),
  repo: z.string(),
  org: z.string(),
  metadata: z.object({
    implementation_status: z.string(),
    tier: z.string().optional(),
    language: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  agents: z.array(z.object({
    name: z.string(),
    trigger: z.string(),
    workflow: z.string(),
    description: z.string().optional(),
  })).optional(),
  produces: z.array(z.object({
    type: z.string(),
    description: z.string().optional(),
    consumers: z.array(z.string()).optional(),
  })).optional(),
  consumes: z.array(z.object({
    type: z.string(),
    source: z.string(),
    description: z.string().optional(),
  })).optional(),
});

export type Seed = z.infer<typeof SeedSchema>;

export interface AnalyzerResult {
  check: string;
  status: 'PASS' | 'FAIL';
  message?: string;
}

export interface SuiteResult {
  analyzer: string;
  results: AnalyzerResult[];
}
