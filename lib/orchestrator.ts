import {
  liuYaoExpertAgent,
  qaAgent,
  questionProcessorAgent,
  realWorldContextAgent,
  synthesizerAgent
} from './agents/prompts.js';
import { executeAgent } from './agents/utils.js';
import type {
  AgentStep,
  OrchestrationResult,
  OrchestratorLogger,
  OrchestratorOptions,
  QaEvaluation
} from './agents/types.js';

const DEFAULT_MAX_QA_ITERATIONS = 3;

const defaultLogger: OrchestratorLogger = {
  debug: (...args) => console.debug(...args),
  warn: (...args) => console.warn(...args)
};

export async function runDivinationOrchestration(
  question: string,
  options: OrchestratorOptions
): Promise<OrchestrationResult> {
  const { client, maxQaIterations = DEFAULT_MAX_QA_ITERATIONS, logger = defaultLogger } = options;
  const steps: AgentStep[] = [];
  let refinedQuestion = question;

  const questionProcessing = await executeAgent(
    questionProcessorAgent,
    client,
    {
      question,
      previousSteps: [...steps]
    }
  );
  refinedQuestion = typeof questionProcessing.output === 'string'
    ? questionProcessing.output
    : question;
  steps.push(questionProcessing.step);

  let liuYaoAnalysis = await runLiuYaoAgent({
    client,
    logger,
    steps,
    refinedQuestion,
    feedback: undefined
  });

  let qaSatisfied = false;
  let qaFeedback: string | undefined;
  let qaIterations = 0;

  while (qaIterations < maxQaIterations && !qaSatisfied) {
    qaIterations += 1;
    const qaResult = await executeAgent(qaAgent, client, {
      question: refinedQuestion,
      liuYaoAnalysis,
      qaFeedback,
      previousSteps: [...steps]
    });
    const evaluation = qaResult.output as QaEvaluation;
    steps.push(qaResult.step);

    if (evaluation.consistent) {
      qaSatisfied = true;
      logger.debug(
        `QA iteration ${qaIterations} approved the Liu Yao analysis.`
      );
      break;
    }

    qaFeedback = evaluation.feedback ?? 'Please clarify and resolve the identified issues.';
    logger.warn(
      `QA iteration ${qaIterations} detected inconsistencies. Feedback: ${qaFeedback}`
    );

    liuYaoAnalysis = await runLiuYaoAgent({
      client,
      logger,
      steps,
      refinedQuestion,
      feedback: qaFeedback
    });
  }

  if (!qaSatisfied) {
    logger.warn(
      `QA loop ended without full approval after ${qaIterations} iteration(s). Proceeding with best available analysis.`
    );
  }

  const contextResult = await executeAgent(realWorldContextAgent, client, {
    question: refinedQuestion,
    liuYaoAnalysis,
    qaFeedback,
    previousSteps: [...steps]
  });
  const contextNotes = typeof contextResult.output === 'string'
    ? contextResult.output
    : contextResult.step.response;
  steps.push(contextResult.step);

  const synthesizerResult = await executeAgent(synthesizerAgent, client, {
    question: refinedQuestion,
    liuYaoAnalysis,
    qaFeedback,
    contextNotes,
    previousSteps: [...steps]
  });
  const finalAnswer = typeof synthesizerResult.output === 'string'
    ? synthesizerResult.output
    : synthesizerResult.step.response;
  steps.push(synthesizerResult.step);

  return {
    finalAnswer,
    qaSatisfied,
    steps
  };
}

async function runLiuYaoAgent({
  client,
  logger,
  steps,
  refinedQuestion,
  feedback
}: {
  client: OrchestratorOptions['client'];
  logger: OrchestratorLogger;
  steps: AgentStep[];
  refinedQuestion: string;
  feedback?: string;
}): Promise<string> {
  const result = await executeAgent(liuYaoExpertAgent, client, {
    question: refinedQuestion,
    qaFeedback: feedback,
    previousSteps: [...steps]
  });
  steps.push(result.step);
  const liuYaoAnalysis = typeof result.output === 'string'
    ? result.output
    : result.step.response;
  logger.debug(
    feedback
      ? 'Re-running Liu Yao agent with QA feedback applied.'
      : 'Executed Liu Yao agent.'
  );
  return liuYaoAnalysis;
}
