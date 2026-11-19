import { useState, type ReactElement } from 'react';
import { VERDICT_LABELS } from '../model/lesson';
import type { Turn } from '../model/plan';
import type { Stage } from '../model/rhythm';
import { Clock, Cue } from './StageViews';
import { Translation } from './translation';

type CueStage = Extract<Stage, { kind: 'cue' }>;
type FeedbackStage = Extract<Stage, { kind: 'feedback' }>;

export function TypedCue({
  turn,
  stage,
  limitSeconds,
  onTyped,
  onAnswer,
}: {
  readonly turn: Turn;
  readonly stage: CueStage;
  readonly limitSeconds: number;
  readonly onTyped: () => void;
  readonly onAnswer: (text: string) => void;
}): ReactElement {
  const [text, setText] = useState('');
  return (
    <div className="rhythm-prompt">
      <Clock
        limitSeconds={limitSeconds}
        startedAt={stage.startedAt}
        running={stage.typedAt === null && !stage.late}
      />
      <Cue turn={turn} />
      {stage.late ? (
        <p className="rhythm-hurry" role="alert">
          加快速度！要在 {limitSeconds} 秒内开始作答。
        </p>
      ) : null}
      <form
        aria-label="作答"
        onSubmit={(event) => {
          event.preventDefault();
          onAnswer(text);
        }}
      >
        <label className="answer">
          你的答案（回车提交）
          <input
            value={text}
            autoComplete="off"
            spellCheck={false}
            autoFocus
            onChange={(event) => {
              if (stage.typedAt === null) {
                onTyped();
              }
              setText(event.target.value);
            }}
          />
        </label>
      </form>
    </div>
  );
}

export function Checking({ answer }: { readonly answer: string }): ReactElement {
  return (
    <p className="status" role="status">
      正在判分：{answer}
    </p>
  );
}

interface ResultProps {
  readonly turn: Turn;
  readonly stage: FeedbackStage;
  readonly limitSeconds: number;
  readonly paused: boolean;
  readonly onNext: () => void;
  readonly onTogglePause: () => void;
}

export function Result({
  turn,
  stage,
  limitSeconds,
  paused,
  onNext,
  onTogglePause,
}: ResultProps): ReactElement {
  const verdict = stage.feedback.verdict;
  return (
    <div className="rhythm-result">
      <Cue turn={turn} />
      <p role="status" className={`verdict verdict-${verdict}`}>
        {VERDICT_LABELS[verdict]}
        {stage.slow ? `，但超过了 ${String(limitSeconds)} 秒` : ''}
      </p>
      <p className="rhythm-said">你的回答：{stage.answer}</p>
      {verdict === 'correct' ? null : (
        <p className="expected">参考答案：{stage.feedback.expected}</p>
      )}
      <Translation text={turn.card.answerTranslation} />
      <div className="actions">
        <button className="button" type="button" onClick={onNext}>
          下一题
        </button>
        <button className="button button-quiet" type="button" onClick={onTogglePause}>
          {paused ? '改为自动翻页' : '暂停自动翻页'}
        </button>
      </div>
    </div>
  );
}
