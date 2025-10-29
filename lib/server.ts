import express from 'express';
import path from 'path';
import { analyzeConsultation, type ConsultationRequest } from './analyzer.js';

const app = express();
const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.post('/api/analyze', (req, res) => {
  try {
    const payload = req.body as Partial<ConsultationRequest>;
    const response = analyzeConsultation({
      question: payload.question ?? '',
      context: payload.context ?? '',
      model: payload.model ?? 'liuyao-lite'
    });
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to analyze consultation.';
    res.status(400).json({ message });
  }
});

const publicDir = path.resolve(process.cwd(), 'public');
app.use(express.static(publicDir));

app.get('/*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`LiuYao prototype listening on http://localhost:${PORT}`);
});
