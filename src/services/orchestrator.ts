import type { AnalysisRequest } from '../schemas/analysis.js';

export interface OrchestratorResult {
  stream?: AsyncIterable<string>;
  analysis?: string;
}

export interface Orchestrator {
  (request: AnalysisRequest & { signal: AbortSignal }): Promise<OrchestratorResult>;
}

export class GPTAPIError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'GPTAPIError';
  }
}

export const orchestrator: Orchestrator = async () => {
  throw new Error(
    'No orchestrator implementation provided. Please inject a concrete implementation before calling the handler.',
  );
};
