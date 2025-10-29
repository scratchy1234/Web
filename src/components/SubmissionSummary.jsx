import PropTypes from 'prop-types';

function SubmissionSummary({ submission }) {
  return (
    <section className="section-card" aria-labelledby="summary-heading">
      <h2 id="summary-heading">Synchronized Intelligence Report</h2>
      <p>
        Submission <strong>{submission.submissionId}</strong> &bull;{' '}
        <time dateTime={submission.timestamp}>{new Date(submission.timestamp).toLocaleString()}</time>
      </p>

      <div className="summary-section">
        <h3>Agent contributions</h3>
        <div className="agent-grid">
          {submission.agents.map(agent => (
            <article key={agent.id} className="section-card">
              <h4>{agent.name}</h4>
              <p><strong>Expertise:</strong> {agent.expertise}</p>
              <p><strong>Confidence:</strong> {agent.confidence}</p>
              <p>{agent.contribution}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="summary-section">
        <h3>Final verdict</h3>
        <p>{submission.finalVerdict}</p>
      </div>

      <div className="summary-section">
        <h3>Real-world advice</h3>
        <p>{submission.realWorldAdvice}</p>
      </div>
    </section>
  );
}

SubmissionSummary.propTypes = {
  submission: PropTypes.shape({
    submissionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    timestamp: PropTypes.string.isRequired,
    agents: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        expertise: PropTypes.string.isRequired,
        confidence: PropTypes.string.isRequired,
        contribution: PropTypes.string.isRequired
      })
    ).isRequired,
    finalVerdict: PropTypes.string.isRequired,
    realWorldAdvice: PropTypes.string.isRequired
  }).isRequired
};

export default SubmissionSummary;
