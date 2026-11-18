import { useState, type ReactElement } from 'react';
import { countWords, WRITING_PROMPTS } from '../model/assessment';
import type { AssessmentRun } from '../model/useAssessment';

const MIN_WORDS = 20;

export function WritingForm({ assessment }: { readonly assessment: AssessmentRun }): ReactElement {
  const [promptId, setPromptId] = useState(WRITING_PROMPTS[0]?.id ?? '');
  const [essay, setEssay] = useState('');
  const prompt = WRITING_PROMPTS.find((candidate) => candidate.id === promptId);
  const words = countWords(essay);
  const recommended = prompt?.task === 'task-1' ? 150 : 250;
  const busy = assessment.state.kind === 'scoring';

  return (
    <form
      aria-label="写作估分"
      onSubmit={(event) => {
        event.preventDefault();
        if (prompt !== undefined) {
          void assessment.scoreWriting(prompt.task, prompt.text, essay);
        }
      }}
    >
      <label>
        题目
        <select
          value={promptId}
          onChange={(event) => {
            setPromptId(event.target.value);
          }}
        >
          {WRITING_PROMPTS.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.task === 'task-1' ? 'Task 1' : 'Task 2'} · {candidate.text.slice(0, 40)}…
            </option>
          ))}
        </select>
      </label>
      <p>{prompt?.text}</p>
      <label>
        你的作文
        <textarea
          rows={12}
          value={essay}
          onChange={(event) => {
            setEssay(event.target.value);
          }}
        />
      </label>
      <p>
        已写 {words} 词（建议至少 {recommended} 词）
      </p>
      <button type="submit" disabled={busy || words < MIN_WORDS}>
        估分
      </button>
    </form>
  );
}
