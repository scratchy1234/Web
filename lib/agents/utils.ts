import type {
  AgentDefinition,
  AgentExecution,
  AgentRuntimeInput,
  AgentStep,
  GptClient
} from './types.js';

export class AgentInvocationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AgentInvocationError';
  }
}

export async function executeAgent<TParsed = unknown>(
  definition: AgentDefinition<TParsed>,
  client: GptClient,
  input: AgentRuntimeInput
): Promise<AgentExecution<TParsed>> {
  try {
    const raw = await client.generate(
      { name: definition.name, prompt: definition.prompt },
      input
    );
    const parsed = definition.parser ? definition.parser(raw) : (raw as unknown as TParsed);
    const step: AgentStep = {
      name: definition.name,
      prompt: definition.prompt,
      response: raw,
      parsed
    };

    return {
      output: parsed,
      step
    };
  } catch (error) {
    throw new AgentInvocationError(
      `Failed to execute agent: ${definition.name}`,
      error
    );
  }
}
