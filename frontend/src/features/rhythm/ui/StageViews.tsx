import { useState, type ReactElement } from 'react';
import { STEP_LABELS, STEP_PURPOSE, VERDICT_LABELS } from '../model/lesson';
import type { Turn } from '../model/plan';
import type { Stage } from '../model/rhythm';

type PromptStage = Extract<Stage, { kind: 'prompt' }>;
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

function Cue({ turn }: { readonly turn: Turn }): ReactElement {
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
  stage,
  index,
}: {
  readonly limitSeconds: number;
  readonly stage: PromptStage;
  readonly index: number;
}): ReactElement {
  const running = stage.spokeAt === null && !stage.late;
  return (
    <div className="rhythm-clock" aria-hidden="true">
      <span
        key={`${String(index)}:${String(stage.startedAt)}`}
        className={running ? 'rhythm-clock-run' : 'rhythm-clock-stop'}
        style={{ animationDuration: `${String(limitSeconds)}s` }}
      />
    </div>
  );
}

interface PromptProps {
  readonly turn: Turn;
  readonly index: number;
  readonly stage: PromptStage;
  readonly voice: boolean;
  readonly limitSeconds: number;
  readonly onStartTyping: () => void;
  readonly onAnswer: (text: string) => void;
  readonly onRetry: () => void;
  readonly onSwitchToTyping: () => void;
}

function VoiceInput({
  stage,
  onRetry,
  onSwitchToTyping,
}: Pick<PromptProps, 'stage' | 'onRetry' | 'onSwitchToTyping'>): ReactElement {
  if (stage.listening) {
    return (
      <p className="rhythm-listening" role="status">
        <span className="rhythm-mic" aria-hidden="true" />
        {stage.heard.length > 0 ? stage.heard : '正在听，请大声说出整句…'}
      </p>
    );
  }
  return (
    <div className="actions">
      <p className="rhythm-note">没听到声音。</p>
      <button className="button" type="button" onClick={onRetry}>
        再说一次
      </button>
      <button className="button button-quiet" type="button" onClick={onSwitchToTyping}>
        改为打字
      </button>
    </div>
  );
}

function TypedInput({
  stage,
  onStartTyping,
  onAnswer,
}: Pick<PromptProps, 'stage' | 'onStartTyping' | 'onAnswer'>): ReactElement {
  const [text, setText] = useState('');
  return (
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
            if (stage.spokeAt === null) {
              onStartTyping();
            }
            setText(event.target.value);
          }}
        />
      </label>
    </form>
  );
}

export function Prompt(props: PromptProps): ReactElement {
  const { turn, index, stage, voice, limitSeconds } = props;
  return (
    <div className="rhythm-prompt">
      <Clock limitSeconds={limitSeconds} stage={stage} index={index} />
      <Cue turn={turn} />
      {stage.late ? (
        <p className="rhythm-hurry" role="alert">
          加快速度！要在 {limitSeconds} 秒内开口。
        </p>
      ) : null}
      {voice ? (
        <VoiceInput
          stage={stage}
          onRetry={props.onRetry}
          onSwitchToTyping={props.onSwitchToTyping}
        />
      ) : (
        <TypedInput
          key={`${String(index)}:${String(stage.attempt)}`}
          stage={stage}
          onStartTyping={props.onStartTyping}
          onAnswer={props.onAnswer}
        />
      )}
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
      <p className="box-note">反应时间 {stage.seconds.toFixed(1)} 秒</p>
      <div className="actions">
        <button className="button" type="button" onClick={onNext}>
          下一题
        </button>
        <button className="button button-quiet" type="button" onClick={onTogglePause}>
          {paused ? '继续自动翻页' : '暂停'}
        </button>
      </div>
    </div>
  );
}
