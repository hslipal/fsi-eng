import { useState, type ReactElement } from 'react';
import { SPEAKING_QUESTIONS } from '../model/assessment';
import type { AssessmentRun } from '../model/useAssessment';

export function SpeakingForm({ assessment }: { readonly assessment: AssessmentRun }): ReactElement {
  const [index, setIndex] = useState(0);
  const [audio, setAudio] = useState<File | null>(null);
  const question = SPEAKING_QUESTIONS[index] ?? '';
  const busy = assessment.state.kind === 'scoring';

  return (
    <form
      aria-label="口语估分"
      onSubmit={(event) => {
        event.preventDefault();
        if (audio !== null) {
          void assessment.scoreSpeaking(index + 1, question, audio);
        }
      }}
    >
      <label>
        题目
        <select
          value={index}
          onChange={(event) => {
            setIndex(Number(event.target.value));
          }}
        >
          {SPEAKING_QUESTIONS.map((text, position) => (
            <option key={text} value={position}>
              Part {position + 1}
            </option>
          ))}
        </select>
      </label>
      <p>{question}</p>
      <label>
        录音文件（最长 2 分钟、8 MB 以内）
        <input
          type="file"
          accept="audio/*"
          onChange={(event) => {
            setAudio(event.target.files?.item(0) ?? null);
          }}
        />
      </label>
      <button type="submit" disabled={busy || audio === null}>
        估分
      </button>
    </form>
  );
}
