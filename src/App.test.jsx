import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders labeled inputs for accessibility', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /ai agent collaboration console/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/agent name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expertise focus/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/key contribution/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/final verdict/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/real-world advice/i)).toBeInTheDocument();
  });

  it('displays validation messages when required fields are empty', async () => {
    render(<App />);

    const [submitButton] = screen.getAllByRole('button', { name: /submit to api/i });
    await userEvent.click(submitButton);

    expect(screen.getAllByRole('alert').map(node => node.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/descriptive name/i),
        expect.stringMatching(/specialty/i),
        expect.stringMatching(/summarize/i),
        expect.stringMatching(/final verdict/i),
        expect.stringMatching(/actionable advice/i)
      ])
    );
  });

  it('submits valid data and renders summary', async () => {
    const fakeResponse = {
      id: 101
    };
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => fakeResponse
    });

    render(<App />);

    const [nameInput] = screen.getAllByLabelText(/agent name/i);
    const [expertiseInput] = screen.getAllByLabelText(/expertise focus/i);
    const [contributionInput] = screen.getAllByLabelText(/key contribution/i);
    const [finalVerdictInput] = screen.getAllByLabelText(/final verdict/i);
    const [adviceInput] = screen.getAllByLabelText(/real-world advice/i);

    await userEvent.type(nameInput, 'Strategist Alpha');
    await userEvent.type(expertiseInput, 'Market analytics');
    await userEvent.type(contributionInput, 'Identified a rising trend in sustainable packaging demand.');
    await userEvent.type(finalVerdictInput, 'Launch the pilot program within the next quarter.');
    await userEvent.type(adviceInput, 'Coordinate supply chain partners and schedule stakeholder briefings.');

    const [submitButton] = screen.getAllByRole('button', { name: /submit to api/i });
    await userEvent.click(submitButton);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://jsonplaceholder.typicode.com/posts',
      expect.objectContaining({
        method: 'POST'
      })
    );

    const summaryHeading = await screen.findByRole('heading', { name: /synchronized intelligence report/i });
    expect(summaryHeading).toBeInTheDocument();

    const summarySection = summaryHeading.closest('section');
    const agentCard = within(screen.getByText(/strategist alpha/i).closest('article'));
    expect(agentCard.getByText(/market analytics/i)).toBeInTheDocument();
    expect(within(summarySection).getByRole('heading', { name: /final verdict/i })).toBeInTheDocument();
    expect(within(summarySection).getByRole('heading', { name: /real-world advice/i })).toBeInTheDocument();
  });
});
