import { useState, type ReactElement } from 'react';
import { sampleUrl, type SpeakingPrompt } from '../model/assessment';
import type { AssessmentRun } from '../model/useAssessment';
import { useSpeakingPrompts } from '../model/useSpeakingPrompts';

export function SpeakingForm({ assessment }: { readonly assessment: AssessmentRun }): ReactElement {
  const prompts = useSpeakingPrompts();
  switch (prompts.kind) {
    case 'loading':
      return (
        <p className="status" role="status">
          正在加载口语题目…
        </p>
      );
    case 'error':
      return (
        <p className="alert" role="alert">
          口语题目加载失败：{prompts.message}
        </p>
      );
    case 'ready':
      return prompts.prompts.length === 0 ? (
        <p className="empty">还没有可用的口语题目。</p>
      ) : (
        <SpeakingQuestion prompts={prompts.prompts} assessment={assessment} />
      );
  }
}

interface QuestionProps {
  readonly prompts: readonly SpeakingPrompt[];
  readonly assessment: AssessmentRun;
}

function SpeakingQuestion({ prompts, assessment }: QuestionProps): ReactElement {
  const [part, setPart] = useState<1 | 2 | 3>(prompts[0]?.part ?? 1);
  const inPart = prompts.filter((prompt) => prompt.part === part);
  const [key, setKey] = useState('');
  const [audio, setAudio] = useState<File | null>(null);
  const prompt = inPart.find((candidate) => candidate.key === key) ?? inPart[0];
  const busy = assessment.state.kind === 'scoring';

  return (
    <form
      aria-label="口语估分"
      onSubmit={(event) => {
        event.preventDefault();
        if (audio !== null && prompt !== undefined) {
          void assessment.scoreSpeaking(prompt.part, prompt.question, audio);
        }
      }}
    >
      <PartAndQuestion
        part={part}
        prompts={inPart}
        selected={prompt?.key ?? ''}
        onPart={(next) => {
          setPart(next);
          setKey('');
        }}
        onQuestion={setKey}
      />
      {prompt === undefined ? (
        <p className="empty">这个部分没有题目。</p>
      ) : (
        <PromptDetails prompt={prompt} />
      )}
      <label className="field">
        你的录音（最长 2 分钟、8 MB 以内）
        <input
          type="file"
          accept="audio/*"
          onChange={(event) => {
            setAudio(event.target.files?.item(0) ?? null);
          }}
        />
      </label>
      <div className="actions">
        <button
          className="button"
          type="submit"
          disabled={busy || audio === null || prompt === undefined}
        >
          估分
        </button>
      </div>
    </form>
  );
}

interface PickerProps {
  readonly part: 1 | 2 | 3;
  readonly prompts: readonly SpeakingPrompt[];
  readonly selected: string;
  readonly onPart: (part: 1 | 2 | 3) => void;
  readonly onQuestion: (key: string) => void;
}

const PARTS = [1, 2, 3] as const;

function PartAndQuestion({
  part,
  prompts,
  selected,
  onPart,
  onQuestion,
}: PickerProps): ReactElement {
  return (
    <>
      <label className="field">
        部分
        <select
          value={part}
          onChange={(event) => {
            onPart(PARTS.find((candidate) => String(candidate) === event.target.value) ?? 1);
          }}
        >
          {PARTS.map((candidate) => (
            <option key={candidate} value={candidate}>
              Part {candidate}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        题目
        <select
          value={selected}
          onChange={(event) => {
            onQuestion(event.target.value);
          }}
        >
          {prompts.map((prompt) => (
            <option key={prompt.key} value={prompt.key}>
              {prompt.question}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

function PromptDetails({ prompt }: { readonly prompt: SpeakingPrompt }): ReactElement {
  const length = prompt.sampleSeconds === null ? '' : `（${prompt.sampleSeconds.toFixed(0)} 秒）`;
  return (
    <div>
      <p className="task-prompt">{prompt.question}</p>
      {prompt.devOnly ? (
        <p className="dev-note" role="note">
          开发素材：来源未授权，仅限开发环境使用
        </p>
      ) : null}
      {prompt.hasSample ? (
        <figure className="sample">
          <figcaption>示范回答{length}</figcaption>
          <audio controls preload="none" src={sampleUrl(prompt)} aria-label="示范回答" />
        </figure>
      ) : null}
    </div>
  );
}
