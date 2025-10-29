import { describe, expect, it } from 'vitest';
import { analyzeConsultation } from '../lib/analyzer.js';

describe('analyzeConsultation', () => {
  it('returns structured guidance for valid input', () => {
    const result = analyzeConsultation({
      question: 'Should I start a new venture this season?',
      context: 'I am balancing family and career goals.',
      model: 'liuyao-classic'
    });

    expect(result.summary).toContain('classic');
    expect(result.reasoning).toContain('balancing family and career goals');
    expect(result.recommendations).toHaveLength(3);
  });

  it('falls back to default model when unknown', () => {
    const result = analyzeConsultation({
      question: 'What path should I follow?',
      model: 'unknown-model'
    });

    expect(result.summary).toContain('lite');
  });

  it('throws when question is missing', () => {
    expect(() =>
      analyzeConsultation({
        question: '   ',
        model: 'liuyao-lite'
      })
    ).toThrow('A question is required for consultation.');
  });

  it('adds experimental recommendation when model is experimental', () => {
    const result = analyzeConsultation({
      question: 'How can I nurture my creativity?',
      model: 'liuyao-experimental'
    });

    expect(result.recommendations).toContain(
      'Incorporate a short mindfulness practice before making key decisions.'
    );
  });
});
