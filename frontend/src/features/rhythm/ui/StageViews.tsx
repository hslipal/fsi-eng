import type { ReactElement } from 'react';
import { STEP_LABELS, STEP_PURPOSE, type Verdict } from '../model/lesson';
import type { Turn } from '../model/plan';
import type { Stage } from '../model/rhythm';
import { Translation } from './translation';

type CueStage = Extract<Stage, { kind: 'cue' }>;
type RevealStage = Extract<Stage, { kind: 'reveal' }>;

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
      <Translation text={turn.card.modelTranslation} />
      <div className="actions">
        <button className="button" type="button" onClick={onBegin}>
          开始{STEP_LABELS[turn.type]}
        </button>
      </div>
    </div>
  );
}

export function Cue({ turn }: { readonly turn: Turn }): ReactElement {
  const { base, model, cue, baseTranslation, modelTranslation, cueTranslation } = turn.card;
  const context = base ?? model;
  return (
    <>
      {context === null ? null : (
        <p className="drill-model">
          {base === null ? '基础句型' : '上一句'}：{context}
        </p>
      )}
      {context === null ? null : (
        <Translation text={base === null ? modelTranslation : baseTranslation} />
      )}
      <p className="drill-cue">
        <span className="drill-cue-label">提示</span>
        <strong className="drill-slot">{cue}</strong>
      </p>
      <Translation text={cueTranslation} />
    </>
  );
}

export function Clock({
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
      <Translation text={turn.card.answerTranslation} />
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
