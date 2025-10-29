import express from 'express';
import { json } from 'express';

import { createAnalysisRouter } from './routes/analysis.js';
import { orchestrator } from './services/orchestrator.js';

export const createApp = () => {
  const app = express();
  app.use(json());
  app.use('/api/analysis', createAnalysisRouter({ orchestrator }));
  return app;
};

export default createApp;
