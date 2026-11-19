import { useState, type ReactElement } from 'react';
import { STEP_LABELS, STEP_PURPOSE, VERDICT_LABELS, type Verdict } from '../model/lesson';
import type { Turn } from '../model/plan';
import type { Stage } from '../model/rhythm';

type CueStage = Extract<Stage, { kind: 'cue' }>;
type RevealStage = Extract<Stage, { kind: 'reveal' }>;
type FeedbackStage = Extract<Stage, { kind: 'feedback' }>;

export function Intro({
  turn,
  onBegin,
}: {
  readonly turn: Turn;
  readonly onBegin: () => void;
}): ReactElement {
  return (
    <div className="rhythm-intro">
      <h3>
        {STEP_LABELS[turn.type]}：{turn.of} 次
      </h3>
      <p>{STEP_PURPOSE[turn.type]}</p>
      <p className="drill-instruction">{turn.card.instruction}</p>
      {turn.card.model === null ? null : <p className="drill-model">基础句型：{turn.card.model}</p>}
      <div className="actions">
        <button className="button" type="button" onClick={onBegin}>
          开始{STEP_LABELS[turn.type]}
        </button>
      </div>
    </div>
  );
}

export function Cue({ turn }: { readonly turn: Turn }): ReactElement {
  const { base, model, cue } = turn.card;
  const context = base ?? model;
  return (
    <>
      {context === null ? null : (
        <p className="drill-model">
          {base === null ? '基础句型' : '上一句'}：{context}
        </p>
      )}
      <p className="drill-cue">
        <span className="drill-cue-label">提示</span>
        <strong className="drill-slot">{cue}</strong>
      </p>
    </>
  );
}

function Clock({
  limitSeconds,
  startedAt,
  running,
}: {
  readonly limitSeconds: number;
  readonly startedAt: number | null;
  readonly running: boolean;
}): ReactElement {
  return (
    <div className="rhythm-clock" aria-hidden="true">
      {startedAt === null ? null : (
        <span
          key={String(startedAt)}
          className={running ? 'rhythm-clock-run' : 'rhythm-clock-stop'}
          style={{ animationDuration: `${String(limitSeconds)}s` }}
        />
      )}
    </div>
  );
}

export function TapeCue({
  turn,
  stage,
  limitSeconds,
  onDone,
}: {
  readonly turn: Turn;
  readonly stage: CueStage;
  readonly limitSeconds: number;
  readonly onDone: () => void;
}): ReactElement {
  return (
    <div className="rhythm-prompt">
      <Clock limitSeconds={limitSeconds} startedAt={stage.startedAt} running />
      <Cue turn={turn} />
      <p className="rhythm-listening" role="status">
        {stage.startedAt === null ? '正在朗读提示…' : '大声说出整句'}
      </p>
      <div className="actions">
        <button className="button" type="button" onClick={onDone}>
          说完了（空格键）
        </button>
      </div>
    </div>
  );
}

const MARKS: readonly {
  readonly verdict: Verdict;
  readonly key: string;
  readonly label: string;
}[] = [
  { verdict: 'correct', key: '1', label: '说对了' },
  { verdict: 'close', key: '2', label: '差一点' },
  { verdict: 'wrong', key: '3', label: '没说对' },
];

export function Reveal({
  turn,
  stage,
  limitSeconds,
  onReadAgain,
  onMark,
}: {
  readonly turn: Turn;
  readonly stage: RevealStage;
  readonly limitSeconds: number;
  readonly onReadAgain: () => void;
  readonly onMark: (verdict: Verdict) => void;
}): ReactElement {
  return (
    <div className="rhythm-result">
      <Cue turn={turn} />
      {stage.seconds === null ? (
        <p className="rhythm-hurry" role="alert">
          {limitSeconds} 秒到了，加快速度！
        </p>
      ) : null}
      <p className="rhythm-answer">{turn.card.answer}</p>
      <p className="rhythm-note">跟着读一遍，然后给自己打分。</p>
      <div className="actions">
        {MARKS.map((mark) => (
          <button
            key={mark.verdict}
            className={`button rhythm-mark rhythm-mark-${mark.verdict}`}
            type="button"
            disabled={stage.saving !== null}
            onClick={() => {
              onMark(mark.verdict);
            }}
          >
            {mark.key} {mark.label}
          </button>
        ))}
        <button className="button button-quiet" type="button" onClick={onReadAgain}>
          再听一遍（R）
        </button>
      </div>
    </div>
  );
}

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
