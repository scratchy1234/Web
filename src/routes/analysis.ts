import type { Request, Response } from 'express';
import { Router } from 'express';

import {
  ValidationError,
  analysisResponseSchema,
  parseAnalysisRequest,
} from '../schemas/analysis.js';
import { GPTAPIError, type Orchestrator } from '../services/orchestrator.js';
import { isAsyncIterable } from '../utils/stream.js';

type AnalysisRouteOptions = {
  orchestrator: Orchestrator;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 60_000;

const writeSSE = (res: Response, data: unknown) => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

export const createAnalysisRouter = ({
  orchestrator,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: AnalysisRouteOptions) => {
  const router = Router();

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    let timeoutHandle: NodeJS.Timeout | undefined;
    const abortController = new AbortController();

    const clearTimer = () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = undefined;
      }
    };

    try {
      const requestBody = parseAnalysisRequest(req.body);

      timeoutHandle = setTimeout(() => {
        abortController.abort();
      }, timeoutMs);

      const orchestratorResult = await orchestrator({ ...requestBody, signal: abortController.signal });

      if (abortController.signal.aborted) {
        res.status(504).json({ error: 'Request timed out' });
        return;
      }

      if (orchestratorResult.stream && isAsyncIterable(orchestratorResult.stream)) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
          for await (const chunk of orchestratorResult.stream) {
            writeSSE(res, { type: 'analysis', content: chunk });
          }
          writeSSE(res, { event: 'end' });
        } catch (error) {
          if (error instanceof GPTAPIError) {
            res.status(502).json({ error: error.message });
            return;
          }
          throw error;
        } finally {
          res.end();
        }
        return;
      }

      if (typeof orchestratorResult.analysis !== 'string' || !orchestratorResult.analysis) {
        throw new Error('Orchestrator did not return an analysis result.');
      }

      const payload = analysisResponseSchema.parse({ analysis: orchestratorResult.analysis });
      res.status(200).json(payload);
    } catch (error) {
      if (abortController.signal.aborted) {
        res.status(504).json({ error: 'Request timed out' });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(422).json({ error: error.message, issues: error.issues });
        return;
      }

      if (error instanceof GPTAPIError) {
        res.status(502).json({ error: error.message });
        return;
      }

      if (error instanceof Error && 'name' in error && error.name === 'AbortError') {
        res.status(504).json({ error: 'Request timed out' });
        return;
      }

      res.status(500).json({ error: 'Unexpected error', details: (error as Error).message });
    } finally {
      clearTimer();
    }
  });

  return router;
};
