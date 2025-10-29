import { describe, expect, it, vi } from 'vitest';
import { runDivinationOrchestration } from '../lib/orchestrator.js';
import type {
  AgentName,
  AgentRuntimeInput,
  GptClient,
  OrchestratorLogger
} from '../lib/agents/types.js';

class MockGptClient implements GptClient {
  public readonly calls: Array<{
    name: AgentName;
    prompt: string;
    input: AgentRuntimeInput;
  }> = [];

  constructor(private readonly script: Array<{ name: AgentName; output: string }>) {}

  async generate(agent: { name: AgentName; prompt: string }, input: AgentRuntimeInput): Promise<string> {
    const next = this.script.shift();
    if (!next) {
      throw new Error(`No scripted response available for agent: ${agent.name}`);
    }
    this.calls.push({ name: agent.name, prompt: agent.prompt, input });
    if (next.name !== agent.name) {
      throw new Error(`Expected agent ${next.name} but received call for ${agent.name}`);
    }
    return next.output;
  }
}

describe('runDivinationOrchestration', () => {
  it('runs each agent once when QA approves immediately', async () => {
    const client = new MockGptClient([
      { name: 'questionProcessor', output: JSON.stringify({ refinedQuestion: 'Refined question' }) },
      { name: 'liuYaoExpert', output: JSON.stringify({ analysis: 'Hexagram insight' }) },
      { name: 'qa', output: JSON.stringify({ consistent: true }) },
      { name: 'contextualizer', output: JSON.stringify({ contextNotes: 'Contextual notes' }) },
      { name: 'synthesizer', output: JSON.stringify({ answer: 'Final synthesis' }) }
    ]);

    const result = await runDivinationOrchestration('Original question', {
      client,
      logger: {
        debug: vi.fn(),
        warn: vi.fn()
      }
    });

    expect(result.finalAnswer).toBe('Final synthesis');
    expect(result.qaSatisfied).toBe(true);
    expect(result.steps.map((step) => step.name)).toEqual([
      'questionProcessor',
      'liuYaoExpert',
      'qa',
      'contextualizer',
      'synthesizer'
    ]);
    expect(client.calls).toHaveLength(5);
    expect(client.calls[2]?.input.liuYaoAnalysis).toContain('Hexagram insight');
  });

  it('retries Liu Yao agent when QA finds inconsistencies', async () => {
    const client = new MockGptClient([
      { name: 'questionProcessor', output: JSON.stringify({ refinedQuestion: 'Refined question' }) },
      { name: 'liuYaoExpert', output: JSON.stringify({ analysis: 'First pass' }) },
      { name: 'qa', output: JSON.stringify({ consistent: false, feedback: 'Need more depth' }) },
      { name: 'liuYaoExpert', output: JSON.stringify({ analysis: 'Second pass', guidance: 'Extra advice' }) },
      { name: 'qa', output: JSON.stringify({ consistent: true }) },
      { name: 'contextualizer', output: JSON.stringify({ contextNotes: 'Context notes' }) },
      { name: 'synthesizer', output: JSON.stringify({ answer: 'Composed answer' }) }
    ]);

    const logger: OrchestratorLogger = {
      debug: vi.fn(),
      warn: vi.fn()
    };

    const result = await runDivinationOrchestration('Original question', {
      client,
      logger,
      maxQaIterations: 4
    });

    expect(result.finalAnswer).toBe('Composed answer');
    expect(result.qaSatisfied).toBe(true);
    expect(result.steps.map((step) => step.name)).toEqual([
      'questionProcessor',
      'liuYaoExpert',
      'qa',
      'liuYaoExpert',
      'qa',
      'contextualizer',
      'synthesizer'
    ]);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('QA iteration 1 detected inconsistencies')
    );
    expect(client.calls.filter((call) => call.name === 'liuYaoExpert')).toHaveLength(2);
    expect(client.calls[3]?.input.qaFeedback).toBe('Need more depth');
  });
});
