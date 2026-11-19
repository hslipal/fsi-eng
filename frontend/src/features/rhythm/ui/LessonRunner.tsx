import { useMemo, type ReactElement } from 'react';
import { STEP_LABELS, type Lesson } from '../model/lesson';
import { buildPlan } from '../model/plan';
import type { RecognitionFactory } from '../model/speech';
import { useLesson } from '../model/useLesson';
import { useRhythmSession, type SessionOptions } from '../model/useRhythmSession';
import { Checking, Intro, Prompt, Result } from './StageViews';
import { Summary } from './Summary';

export interface RhythmSettings extends SessionOptions {
  readonly repetitions: number;
}

interface RunnerProps {
  readonly lessonId: string;
  readonly settings: RhythmSettings;
  readonly recognition: RecognitionFactory | null;
  readonly onExit: () => void;
}

export function LessonRunner({
  lessonId,
  settings,
  recognition,
  onExit,
}: RunnerProps): ReactElement {
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
        <Drill lesson={lesson.value} settings={settings} recognition={recognition} />
      ) : null}
    </div>
  );
}

interface DrillProps {
  readonly lesson: Lesson;
  readonly settings: RhythmSettings;
  readonly recognition: RecognitionFactory | null;
}

function Drill({ lesson, settings, recognition }: DrillProps): ReactElement {
  const plan = useMemo(
    () => buildPlan(lesson.cards, settings.repetitions),
    [lesson, settings.repetitions],
  );
  const session = useRhythmSession(plan, settings, recognition);
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
      {data.notice === null ? null : (
        <p className="alert" role="alert">
          {data.notice}
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
  readonly session: ReturnType<typeof useRhythmSession>;
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
        判分失败：{stage.message}
      </p>
    );
  }
  if (turn === undefined) {
    return null;
  }
  switch (stage.kind) {
    case 'intro':
      return <Intro turn={turn} onBegin={session.begin} />;
    case 'prompt':
      return (
        <Prompt
          turn={turn}
          index={data.index}
          stage={stage}
          voice={data.mode === 'voice'}
          limitSeconds={limitSeconds}
          onStartTyping={session.startTyping}
          onAnswer={session.answer}
          onRetry={session.retry}
          onSwitchToTyping={session.switchToTyping}
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
