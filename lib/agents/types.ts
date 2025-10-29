export type AgentName =
  | 'questionProcessor'
  | 'liuYaoExpert'
  | 'qa'
  | 'contextualizer'
  | 'synthesizer';

export interface AgentStep {
  name: AgentName;
  prompt: string;
  response: string;
  parsed: unknown;
}

export interface AgentRuntimeInput {
  question: string;
  liuYaoAnalysis?: string;
  qaFeedback?: string;
  contextNotes?: string;
  previousSteps: AgentStep[];
}

export interface AgentDefinition<TParsed = unknown> {
  name: AgentName;
  prompt: string;
  parser?: (raw: string) => TParsed;
}

export interface AgentExecution<TParsed = unknown> {
  output: TParsed;
  step: AgentStep;
}

export interface QaEvaluation {
  consistent: boolean;
  feedback?: string;
  reasons?: string[];
}

export interface OrchestratorLogger {
  debug: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
}

export interface GptClient {
  generate: (
    agent: { name: AgentName; prompt: string },
    input: AgentRuntimeInput
  ) => Promise<string>;
}

export interface OrchestrationResult {
  finalAnswer: string;
  qaSatisfied: boolean;
  steps: AgentStep[];
}

export interface OrchestratorOptions {
  client: GptClient;
  maxQaIterations?: number;
  logger?: OrchestratorLogger;
}
