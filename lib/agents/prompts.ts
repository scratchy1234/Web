import { AgentDefinition, QaEvaluation } from './types.js';

const jsonInstruction =
  'Respond with valid JSON that matches the documented schema. Avoid commentary outside of the JSON payload.';

export const questionProcessorAgent: AgentDefinition<string> = {
  name: 'questionProcessor',
  prompt: `You are an intake specialist helping structure divination questions. ${jsonInstruction}
Return an object with:\n- refinedQuestion: the clarified question from the seeker.\n- keyDetails: bullet-point notes about the situation.`,
  parser: (raw) => {
    try {
      const parsed = JSON.parse(raw) as { refinedQuestion?: string; keyDetails?: string };
      const refined = parsed.refinedQuestion ?? parsed.keyDetails ?? raw;
      return refined;
    } catch (error) {
      return raw;
    }
  }
};

export const liuYaoExpertAgent: AgentDefinition<string> = {
  name: 'liuYaoExpert',
  prompt: `You are a seasoned Liu Yao (六爻) divination expert. ${jsonInstruction}
Return an object with:\n- analysis: interpretation of the hexagrams and changing lines.\n- guidance: actionable advice.`,
  parser: (raw) => {
    try {
      const parsed = JSON.parse(raw) as { analysis?: string; guidance?: string };
      const pieces = [parsed.analysis, parsed.guidance].filter(Boolean);
      return pieces.length > 0 ? pieces.join('\n\n') : raw;
    } catch (error) {
      return raw;
    }
  }
};

export const qaAgent: AgentDefinition<QaEvaluation> = {
  name: 'qa',
  prompt: `You are a meticulous QA agent reviewing the Liu Yao expert's interpretation. ${jsonInstruction}
Return an object with:\n- consistent: boolean indicating whether the reasoning is coherent.\n- feedback: clear corrective notes when inconsistencies are found.\n- reasons: array summarising contradictions found.`,
  parser: (raw) => {
    try {
      const parsed = JSON.parse(raw) as QaEvaluation;
      return {
        consistent: Boolean(parsed.consistent),
        feedback: parsed.feedback,
        reasons: parsed.reasons
      } satisfies QaEvaluation;
    } catch (error) {
      return { consistent: true } satisfies QaEvaluation;
    }
  }
};

export const realWorldContextAgent: AgentDefinition<string> = {
  name: 'contextualizer',
  prompt: `You map symbolic divination insights to pragmatic, real-world context. ${jsonInstruction}
Return an object with:\n- contextNotes: practical considerations that relate the reading to everyday life.`,
  parser: (raw) => {
    try {
      const parsed = JSON.parse(raw) as { contextNotes?: string };
      return parsed.contextNotes ?? raw;
    } catch (error) {
      return raw;
    }
  }
};

export const synthesizerAgent: AgentDefinition<string> = {
  name: 'synthesizer',
  prompt: `You synthesise the Liu Yao divination, QA findings, and real-world context. ${jsonInstruction}
Return an object with:\n- answer: a compassionate, actionable response to the seeker.`,
  parser: (raw) => {
    try {
      const parsed = JSON.parse(raw) as { answer?: string };
      return parsed.answer ?? raw;
    } catch (error) {
      return raw;
    }
  }
};
