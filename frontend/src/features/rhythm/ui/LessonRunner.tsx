import { useEffect, useMemo, type ReactElement } from 'react';
import { STEP_LABELS, type Lesson, type Verdict } from '../model/lesson';
import { buildPlan } from '../model/plan';
import { useLesson } from '../model/useLesson';
import {
  useRhythmSession,
  type RhythmSession,
  type SessionOptions,
} from '../model/useRhythmSession';
import type { Speaker } from '../model/voice';
import { Checking, Intro, Result, Reveal, TapeCue, TypedCue } from './StageViews';
import { Summary } from './Summary';

export interface RhythmSettings extends SessionOptions {
  readonly repetitions: number;
  readonly rate: number;
}

interface RunnerProps {
  readonly lessonId: string;
  readonly settings: RhythmSettings;
  readonly speaker: Speaker | null;
  readonly onExit: () => void;
}

export function LessonRunner({ lessonId, settings, speaker, onExit }: RunnerProps): ReactElement {
  const lesson = useLesson(lessonId);
  return (
    <div className="rhythm-lesson">
      <div className="rhythm-lesson-head">
        <h3>{lesson.kind === 'ready' ? lesson.value.title : '加载课程…'}</h3>
        <button className="button button-quiet" type="button" onClick={onExit}>
          退出这一课
        </button>
      </div>
      {lesson.kind === 'loading' ? (
        <p className="status" role="status">
          加载中…
        </p>
      ) : null}
      {lesson.kind === 'error' ? (
        <p className="alert" role="alert">
          课程加载失败：{lesson.message}
        </p>
      ) : null}
      {lesson.kind === 'ready' && lesson.value.devOnly ? (
        <p className="dev-note" role="note">
          开发素材：取自未授权的图书，仅限开发环境使用
        </p>
      ) : null}
      {lesson.kind === 'ready' ? (
        <Drill lesson={lesson.value} settings={settings} speaker={speaker} />
      ) : null}
    </div>
  );
}

interface DrillProps {
  readonly lesson: Lesson;
  readonly settings: RhythmSettings;
  readonly speaker: Speaker | null;
}

const MARK_KEYS: Readonly<Record<string, Verdict>> = { '1': 'correct', '2': 'close', '3': 'wrong' };

/** Tape mode keys: space or Enter = done; 1/2/3 = mark; R = read the answer again. */
function onTapeKey(kind: 'cue' | 'reveal', key: string, session: RhythmSession): boolean {
  if (kind === 'cue') {
    if (key === ' ' || key === 'enter') {
      session.done();
      return true;
    }
    return false;
  }
  const verdict = MARK_KEYS[key];
  if (verdict !== undefined) {
    session.mark(verdict);
    return true;
  }
  if (key === 'r') {
    session.readAgain();
    return true;
  }
  return false;
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLSelectElement;
}

function useTapeKeys(session: RhythmSession): void {
  const stage = session.data.stage.kind;
  const kind =
    session.data.mode === 'tape' && (stage === 'cue' || stage === 'reveal') ? stage : null;
  useEffect(() => {
    if (kind === null) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent): void => {
      if (
        !event.repeat &&
        !isTyping(event.target) &&
        onTapeKey(kind, event.key.toLowerCase(), session)
      ) {
        event.preventDefault();
      }
    };
    globalThis.addEventListener('keydown', onKey);
    return () => {
      globalThis.removeEventListener('keydown', onKey);
    };
  }, [kind, session]);
}

function Drill({ lesson, settings, speaker }: DrillProps): ReactElement {
  const plan = useMemo(
    () => buildPlan(lesson.cards, settings.repetitions),
    [lesson, settings.repetitions],
  );
  const session = useRhythmSession(plan, settings, speaker);
  useTapeKeys(session);
  const { data, turn } = session;
  return (
    <div className="drill">
      {turn === undefined || data.stage.kind === 'intro' ? null : (
        <p className="drill-progress">
          {STEP_LABELS[turn.type]} 第 {turn.turn}/{turn.of} 次
          <span
            className="drill-progress-bar"
            style={{ width: `${String((turn.turn / turn.of) * 100)}%` }}
          />
        </p>
      )}
      <StageBody session={session} limitSeconds={settings.limitSeconds} />
    </div>
  );
}

function StageBody({
  session,
  limitSeconds,
}: {
  readonly session: RhythmSession;
  readonly limitSeconds: number;
}): ReactElement | null {
  const { data, turn } = session;
  const stage = data.stage;
  if (stage.kind === 'done') {
    return <Summary results={data.results} limitSeconds={limitSeconds} />;
  }
  if (stage.kind === 'error') {
    return (
      <p className="alert" role="alert">
        保存失败：{stage.message}
      </p>
    );
  }
  if (turn === undefined) {
    return null;
  }
  switch (stage.kind) {
    case 'intro':
      return <Intro turn={turn} onBegin={session.begin} />;
    case 'cue':
      return <CueBody session={session} stage={stage} turn={turn} limitSeconds={limitSeconds} />;
    case 'reveal':
      return (
        <Reveal
          turn={turn}
          stage={stage}
          limitSeconds={limitSeconds}
          onReadAgain={session.readAgain}
          onMark={session.mark}
        />
      );
    case 'checking':
      return <Checking answer={stage.answer} />;
    case 'feedback':
      return (
        <Result
          turn={turn}
          stage={stage}
          limitSeconds={limitSeconds}
          paused={data.paused}
          onNext={session.next}
          onTogglePause={session.togglePause}
        />
      );
  }
}

function CueBody({
  session,
  stage,
  turn,
  limitSeconds,
}: {
  readonly session: RhythmSession;
  readonly stage: Extract<RhythmSession['data']['stage'], { kind: 'cue' }>;
  readonly turn: NonNullable<RhythmSession['turn']>;
  readonly limitSeconds: number;
}): ReactElement {
  return session.data.mode === 'tape' ? (
    <TapeCue turn={turn} stage={stage} limitSeconds={limitSeconds} onDone={session.done} />
  ) : (
    <TypedCue
      key={session.data.index}
      turn={turn}
      stage={stage}
      limitSeconds={limitSeconds}
      onTyped={session.typed}
      onAnswer={session.answer}
    />
  );
}
