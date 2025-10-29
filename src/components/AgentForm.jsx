import PropTypes from 'prop-types';

function AgentForm({
  agents,
  onAgentChange,
  onAddAgent,
  onRemoveAgent,
  finalVerdict,
  onFinalVerdictChange,
  realWorldAdvice,
  onRealWorldAdviceChange,
  onSubmit,
  errors,
  submitting = false
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit} noValidate>
      <div className="agent-grid">
        {agents.map((agent, index) => {
          const agentErrors = errors.agents?.[agent.id] ?? {};
          return (
            <fieldset key={agent.id} className="section-card" aria-describedby={`agent-${agent.id}-errors`}>
              <legend>Agent {index + 1}</legend>
              <div className="form-grid" id={`agent-${agent.id}-errors`}>
                <div>
                  <label htmlFor={`agent-${agent.id}-name`}>Agent name</label>
                  <input
                    id={`agent-${agent.id}-name`}
                    name={`agent-${agent.id}-name`}
                    autoComplete="off"
                    required
                    value={agent.name}
                    onChange={event => onAgentChange(agent.id, 'name', event.target.value)}
                    aria-invalid={agentErrors.name ? 'true' : 'false'}
                    aria-describedby={agentErrors.name ? `agent-${agent.id}-name-error` : undefined}
                  />
                  {agentErrors.name && (
                    <p className="error-message" id={`agent-${agent.id}-name-error`} role="alert">
                      {agentErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor={`agent-${agent.id}-expertise`}>Expertise focus</label>
                  <input
                    id={`agent-${agent.id}-expertise`}
                    name={`agent-${agent.id}-expertise`}
                    required
                    value={agent.expertise}
                    onChange={event => onAgentChange(agent.id, 'expertise', event.target.value)}
                    aria-invalid={agentErrors.expertise ? 'true' : 'false'}
                    aria-describedby={agentErrors.expertise ? `agent-${agent.id}-expertise-error` : undefined}
                  />
                  {agentErrors.expertise && (
                    <p className="error-message" id={`agent-${agent.id}-expertise-error`} role="alert">
                      {agentErrors.expertise}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor={`agent-${agent.id}-contribution`}>Key contribution</label>
                  <textarea
                    id={`agent-${agent.id}-contribution`}
                    name={`agent-${agent.id}-contribution`}
                    required
                    value={agent.contribution}
                    onChange={event => onAgentChange(agent.id, 'contribution', event.target.value)}
                    aria-invalid={agentErrors.contribution ? 'true' : 'false'}
                    aria-describedby={
                      agentErrors.contribution ? `agent-${agent.id}-contribution-error` : undefined
                    }
                  />
                  {agentErrors.contribution && (
                    <p className="error-message" id={`agent-${agent.id}-contribution-error`} role="alert">
                      {agentErrors.contribution}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor={`agent-${agent.id}-confidence`}>Confidence</label>
                  <select
                    id={`agent-${agent.id}-confidence`}
                    name={`agent-${agent.id}-confidence`}
                    value={agent.confidence}
                    onChange={event => onAgentChange(agent.id, 'confidence', event.target.value)}
                  >
                    <option value="balanced">Balanced</option>
                    <option value="optimistic">Optimistic</option>
                    <option value="cautious">Cautious</option>
                  </select>
                </div>

                <div>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onRemoveAgent(agent.id)}
                    disabled={agents.length === 1 || submitting}
                    aria-label={`Remove agent ${index + 1}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="form-grid-two">
        <div>
          <label htmlFor="final-verdict">Final verdict</label>
          <textarea
            id="final-verdict"
            name="final-verdict"
            required
            value={finalVerdict}
            onChange={event => onFinalVerdictChange(event.target.value)}
            aria-invalid={errors.fields?.finalVerdict ? 'true' : 'false'}
            aria-describedby={errors.fields?.finalVerdict ? 'final-verdict-error' : undefined}
          />
          {errors.fields?.finalVerdict && (
            <p className="error-message" id="final-verdict-error" role="alert">
              {errors.fields.finalVerdict}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="real-world-advice">Real-world advice</label>
          <textarea
            id="real-world-advice"
            name="real-world-advice"
            required
            value={realWorldAdvice}
            onChange={event => onRealWorldAdviceChange(event.target.value)}
            aria-invalid={errors.fields?.realWorldAdvice ? 'true' : 'false'}
            aria-describedby={errors.fields?.realWorldAdvice ? 'real-world-advice-error' : undefined}
          />
          {errors.fields?.realWorldAdvice && (
            <p className="error-message" id="real-world-advice-error" role="alert">
              {errors.fields.realWorldAdvice}
            </p>
          )}
        </div>
      </div>

      <div className="form-grid" aria-live="polite">
        <button type="button" className="secondary" onClick={onAddAgent} disabled={submitting}>
          Add another agent
        </button>
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Submitting insights…' : 'Submit to API'}
        </button>
      </div>
    </form>
  );
}

AgentForm.propTypes = {
  agents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      expertise: PropTypes.string.isRequired,
      contribution: PropTypes.string.isRequired,
      confidence: PropTypes.string.isRequired
    })
  ).isRequired,
  onAgentChange: PropTypes.func.isRequired,
  onAddAgent: PropTypes.func.isRequired,
  onRemoveAgent: PropTypes.func.isRequired,
  finalVerdict: PropTypes.string.isRequired,
  onFinalVerdictChange: PropTypes.func.isRequired,
  realWorldAdvice: PropTypes.string.isRequired,
  onRealWorldAdviceChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  errors: PropTypes.shape({
    agents: PropTypes.object,
    fields: PropTypes.object
  }).isRequired,
  submitting: PropTypes.bool
};

export default AgentForm;
