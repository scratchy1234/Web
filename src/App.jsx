import { useMemo, useState } from 'react';
import AgentForm from './components/AgentForm.jsx';
import SubmissionSummary from './components/SubmissionSummary.jsx';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createAgent = (index = 0) => ({
  id: generateId(),
  name: '',
  expertise: '',
  contribution: '',
  confidence: 'balanced',
  index
});

function App() {
  const [agents, setAgents] = useState([createAgent(1)]);
  const [finalVerdict, setFinalVerdict] = useState('');
  const [realWorldAdvice, setRealWorldAdvice] = useState('');
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle', message: null, data: null });

  const validationRules = useMemo(
    () => ({
      agentName: value =>
        !value || value.trim().length < 2
          ? 'Provide a descriptive name (2+ characters).'
          : '',
      expertise: value => (!value ? 'Share the agent\'s specialty.' : ''),
      contribution: value =>
        !value || value.trim().length < 10
          ? 'Summarize the insight in 10+ characters.'
          : '',
      finalVerdict: value =>
        !value || value.trim().length < 10
          ? 'Outline the final verdict with at least 10 characters.'
          : '',
      realWorldAdvice: value =>
        !value || value.trim().length < 10
          ? 'Offer actionable advice with at least 10 characters.'
          : ''
    }),
    []
  );

  const validate = current => {
    const formErrors = { agents: {}, fields: {} };

    current.agents.forEach(agent => {
      const agentErrors = {};
      const nameError = validationRules.agentName(agent.name);
      if (nameError) agentErrors.name = nameError;
      const expertiseError = validationRules.expertise(agent.expertise);
      if (expertiseError) agentErrors.expertise = expertiseError;
      const contributionError = validationRules.contribution(agent.contribution);
      if (contributionError) agentErrors.contribution = contributionError;
      if (Object.keys(agentErrors).length) {
        formErrors.agents[agent.id] = agentErrors;
      }
    });

    const finalVerdictError = validationRules.finalVerdict(current.finalVerdict);
    if (finalVerdictError) {
      formErrors.fields.finalVerdict = finalVerdictError;
    }

    const adviceError = validationRules.realWorldAdvice(current.realWorldAdvice);
    if (adviceError) {
      formErrors.fields.realWorldAdvice = adviceError;
    }

    return formErrors;
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const payload = {
      agents,
      finalVerdict,
      realWorldAdvice
    };
    const validationResults = validate(payload);
    const hasErrors =
      Object.keys(validationResults.agents).length > 0 ||
      Object.keys(validationResults.fields).length > 0;

    if (hasErrors) {
      setErrors(validationResults);
      setStatus(prev => ({ ...prev, state: 'invalid', message: 'Review the highlighted fields.' }));
      return;
    }

    setErrors({ agents: {}, fields: {} });
    setStatus({ state: 'submitting', message: 'Sharing insights with the coordination API…', data: null });

    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('The API declined the submission.');
      }

      const responseBody = await response.json();
      setStatus({
        state: 'success',
        message: 'Agents synced successfully.',
        data: {
          submissionId: responseBody.id ?? generateId(),
          timestamp: new Date().toISOString(),
          ...payload
        }
      });
    } catch (error) {
      setStatus({
        state: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'We were unable to connect to the collaboration API.',
        data: null
      });
    }
  };

  const handleAgentChange = (id, field, value) => {
    setAgents(previous =>
      previous.map(agent =>
        agent.id === id
          ? {
              ...agent,
              [field]: value
            }
          : agent
      )
    );
  };

  const handleAddAgent = () => {
    setAgents(previous => [...previous, createAgent(previous.length + 1)]);
  };

  const handleRemoveAgent = id => {
    setAgents(previous => (previous.length > 1 ? previous.filter(agent => agent.id !== id) : previous));
  };

  return (
    <main>
      <header className="section-card highlight" aria-live="polite">
        <h1>AI Agent Collaboration Console</h1>
        <p>
          Align multi-agent insights, capture a final verdict, and articulate real-world guidance in one accessible
          workspace.
        </p>
      </header>

      <section className="section-card" aria-labelledby="agent-form-heading">
        <div className="form-grid" role="group" aria-describedby="form-status">
          <div>
            <h2 id="agent-form-heading">Curate Agent Inputs</h2>
            <p>
              Detail each agent&apos;s perspective, then craft a unified verdict and actionable advice before submitting to
              the coordination API.
            </p>
          </div>

          <AgentForm
            agents={agents}
            onAgentChange={handleAgentChange}
            onAddAgent={handleAddAgent}
            onRemoveAgent={handleRemoveAgent}
            finalVerdict={finalVerdict}
            onFinalVerdictChange={setFinalVerdict}
            realWorldAdvice={realWorldAdvice}
            onRealWorldAdviceChange={setRealWorldAdvice}
            onSubmit={handleSubmit}
            errors={errors}
            submitting={status.state === 'submitting'}
          />
          <div id="form-status" aria-live="polite">
            {status.state === 'invalid' && (
              <div className="status-banner error" role="alert">
                {status.message}
              </div>
            )}
            {status.state === 'submitting' && (
              <div className="status-banner" role="status">
                {status.message}
              </div>
            )}
            {status.state === 'error' && (
              <div className="status-banner error" role="alert">
                {status.message}
              </div>
            )}
            {status.state === 'success' && status.data && (
              <div className="status-banner success" role="status">
                {status.message}
              </div>
            )}
          </div>
        </div>
      </section>

      {status.state === 'success' && status.data && (
        <SubmissionSummary
          submission={status.data}
        />
      )}
    </main>
  );
}

export default App;
