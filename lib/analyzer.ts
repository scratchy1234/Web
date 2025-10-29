export interface ConsultationRequest {
  question: string;
  context?: string;
  model: string;
}

export interface ConsultationResponse {
  summary: string;
  reasoning: string;
  recommendations: string[];
}

const MODEL_DESCRIPTIONS: Record<string, string> = {
  'liuyao-lite': 'a concise interpretation balancing intuition with classical hexagram cues.',
  'liuyao-classic': 'a traditional six-line analysis emphasising yin-yang balance and elemental relations.',
  'liuyao-experimental': 'an exploratory blend that introduces contemporary mindfulness practices.'
};

export function analyzeConsultation(request: ConsultationRequest): ConsultationResponse {
  const { question, context = '', model } = request;
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) {
    throw new Error('A question is required for consultation.');
  }

  const normalizedModel = MODEL_DESCRIPTIONS[model] ? model : 'liuyao-lite';
  const description = MODEL_DESCRIPTIONS[normalizedModel];
  const contextSentence = context
    ? `The querent also provided context: "${context}".`
    : 'No additional context was supplied, so the reading focuses on the core inquiry.';

  const summary = `Using the ${normalizedModel.replace('liuyao-', '').replace('-', ' ')} approach, the outlook encourages patience and deliberate action.`;
  const reasoning = [
    `The analysis draws on ${description}`,
    contextSentence,
    `The symbolic pattern suggests aligning intent with supportive relationships and keeping a flexible mindset.`
  ].join(' ');

  const recommendations: string[] = [
    'Take time to observe how circumstances shift over the next six days.',
    'Document intuitive impressions and compare them with tangible developments.',
    'Engage a trusted confidant to reflect on potential blind spots.'
  ];

  if (normalizedModel === 'liuyao-experimental') {
    recommendations.push('Incorporate a short mindfulness practice before making key decisions.');
  }

  return {
    summary,
    reasoning,
    recommendations
  };
}
