import express, { json } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createAnalysisRouter } from '../src/routes/analysis.js';
import { GPTAPIError, type Orchestrator } from '../src/services/orchestrator.js';

const buildApp = (orchestrator: Orchestrator, timeoutMs = 2000) => {
  const app = express();
  app.use(json());
  app.use('/api/analysis', createAnalysisRouter({ orchestrator, timeoutMs }));
  return app;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/analysis', () => {
  const validPayload = {
    question: 'How can we improve onboarding?',
    context: 'We noticed a drop in retention during onboarding.',
    personalData: {
      name: 'Alex',
      email: 'alex@example.com',
    },
  };

  it('returns the orchestrated analysis as JSON when no stream is provided', async () => {
    const orchestrator = vi.fn(async () => ({ analysis: 'Detailed analysis' }));
    const response = await request(buildApp(orchestrator)).post('/api/analysis').send(validPayload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ analysis: 'Detailed analysis' });
    expect(orchestrator).toHaveBeenCalledWith(expect.objectContaining(validPayload));
  });

  it('streams orchestrator chunks using server-sent events', async () => {
    async function* stream() {
      yield 'First insight';
      yield 'Second insight';
    }

    const orchestrator = vi.fn(async () => ({ stream: stream() }));

    const response = await request(buildApp(orchestrator))
      .post('/api/analysis')
      .send(validPayload)
      .buffer(true)
      .parse((res, cb) => {
        res.setEncoding('utf8');
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => cb(null, data));
      });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.body).toContain('First insight');
    expect(response.body).toContain('Second insight');
  });

  it('returns 422 when the payload fails validation', async () => {
    const orchestrator = vi.fn();
    const response = await request(buildApp(orchestrator))
      .post('/api/analysis')
      .send({ context: 'Missing question' });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('Invalid request payload');
    expect(response.body.issues).toBeDefined();
    expect(orchestrator).not.toHaveBeenCalled();
  });

  it('returns 502 when the orchestrator raises a GPTAPIError', async () => {
    const orchestrator = vi.fn(async () => {
      throw new GPTAPIError('OpenAI unavailable');
    });

    const response = await request(buildApp(orchestrator)).post('/api/analysis').send(validPayload);

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ error: 'OpenAI unavailable' });
  });

  it('returns 504 when the request times out', async () => {
    const orchestrator = vi.fn(async ({ signal }) => {
      await new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          const abortError = new Error('Aborted');
          abortError.name = 'AbortError';
          reject(abortError);
        });
      });
      return { analysis: 'Too late' };
    });

    const response = await request(buildApp(orchestrator, 50)).post('/api/analysis').send(validPayload);

    expect(response.status).toBe(504);
    expect(response.body).toEqual({ error: 'Request timed out' });
  });
});
