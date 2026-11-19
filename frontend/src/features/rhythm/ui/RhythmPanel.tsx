import { useState, type ReactElement } from 'react';
import { STEP_LABELS, TRACK_LABELS, TRACKS, type LessonSummary, type Track } from '../model/lesson';
import { REPETITION_CHOICES } from '../model/plan';
import { DEFAULT_LIMIT_SECONDS, LIMIT_CHOICES, type InputMode } from '../model/rhythm';
import { browserRecognition, type RecognitionFactory } from '../model/speech';
import { useLessons } from '../model/useLesson';
import { LessonRunner, type RhythmSettings } from './LessonRunner';

interface PanelProps {
  /** Speech recognition; defaults to the browser's. Null means typing only. */
  readonly recognition?: RecognitionFactory | null;
}

/** FSI pattern drills at speed: one lesson, each drill type many times, against the clock. */
export function RhythmPanel({ recognition }: PanelProps): ReactElement {
  const [speech] = useState(() => (recognition === undefined ? browserRecognition() : recognition));
  const [track, setTrack] = useState<Track>('business');
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [settings, setSettings] = useState<RhythmSettings>({
    limitSeconds: DEFAULT_LIMIT_SECONDS,
    repetitions: 20,
    mode: speech === null ? 'typing' : 'voice',
  });

  return (
    <section className="panel" aria-labelledby="rhythm-title">
      <h2 id="rhythm-title">节奏训练</h2>
      <p className="panel-lead">
        {`FSI 的句型操练：先替换，再转换、回应、扩展。提示一出现就开口，每种练习连续做 ${String(settings.repetitions)} 次。`}
      </p>
      {lessonId === null ? (
        <>
          <Settings settings={settings} voiceAvailable={speech !== null} onChange={setSettings} />
          <TrackTabs track={track} onChange={setTrack} />
          <LessonList track={track} onPick={setLessonId} />
        </>
      ) : (
        <LessonRunner
          key={lessonId}
          lessonId={lessonId}
          settings={settings}
          recognition={speech}
          onExit={() => {
            setLessonId(null);
          }}
        />
      )}
    </section>
  );
}

function TrackTabs({
  track,
  onChange,
}: {
  readonly track: Track;
  readonly onChange: (track: Track) => void;
}): ReactElement {
  return (
    <div className="tabs" role="tablist" aria-label="赛道">
      {TRACKS.map((candidate) => (
        <button
          key={candidate}
          type="button"
          role="tab"
          className="tab"
          aria-selected={candidate === track}
          onClick={() => {
            onChange(candidate);
          }}
        >
          {TRACK_LABELS[candidate]}
        </button>
      ))}
    </div>
  );
}

interface SettingsProps {
  readonly settings: RhythmSettings;
  readonly voiceAvailable: boolean;
  readonly onChange: (settings: RhythmSettings) => void;
}

const MODE_LABELS: Readonly<Record<InputMode, string>> = { voice: '开口说', typing: '打字' };

function Settings({ settings, voiceAvailable, onChange }: SettingsProps): ReactElement {
  return (
    <fieldset className="rhythm-settings">
      <legend>练习设置</legend>
      <label className="field">
        限时
        <select
          value={settings.limitSeconds}
          onChange={(event) => {
            onChange({ ...settings, limitSeconds: Number(event.target.value) });
          }}
        >
          {LIMIT_CHOICES.map((seconds) => (
            <option key={seconds} value={seconds}>
              {seconds} 秒内开口
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        每种练习
        <select
          value={settings.repetitions}
          onChange={(event) => {
            onChange({ ...settings, repetitions: Number(event.target.value) });
          }}
        >
          {REPETITION_CHOICES.map((count) => (
            <option key={count} value={count}>
              {count} 次
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        作答方式
        <select
          value={settings.mode}
          onChange={(event) => {
            onChange({ ...settings, mode: event.target.value === 'voice' ? 'voice' : 'typing' });
          }}
        >
          {(['voice', 'typing'] as const).map((mode) => (
            <option key={mode} value={mode} disabled={mode === 'voice' && !voiceAvailable}>
              {MODE_LABELS[mode]}
            </option>
          ))}
        </select>
      </label>
      <VoiceNote available={voiceAvailable} />
    </fieldset>
  );
}

function VoiceNote({ available }: { readonly available: boolean }): ReactElement {
  return (
    <p className="rhythm-note">
      {available
        ? '开口说使用浏览器自带的语音识别（Chrome 会把录音发给 Google 识别）。'
        : '这个浏览器不支持语音识别，只能打字。用 Chrome 或 Edge 可以开口说。'}
    </p>
  );
}

function stepsText(lesson: LessonSummary): string {
  return lesson.steps
    .map((step) => `${STEP_LABELS[step.type]} ${String(step.count)} 题`)
    .join('，');
}

function LessonList({
  track,
  onPick,
}: {
  readonly track: Track;
  readonly onPick: (id: string) => void;
}): ReactElement {
  const lessons = useLessons(track);
  switch (lessons.kind) {
    case 'loading':
      return (
        <p className="status" role="status">
          加载中…
        </p>
      );
    case 'error':
      return (
        <p className="alert" role="alert">
          课程加载失败：{lessons.message}
        </p>
      );
    case 'ready':
      if (lessons.value.length === 0) {
        return <p className="empty">这个赛道还没有可以练的句型。</p>;
      }
      return (
        <ul className="library-list" aria-label="课程">
          {lessons.value.map((lesson) => (
            <li key={lesson.id} className="library-item">
              <span className="library-title">{lesson.title}</span>
              <span className="library-meta">{stepsText(lesson)}</span>
              <button
                className="button"
                type="button"
                aria-label={`开始练习：${lesson.title}`}
                onClick={() => {
                  onPick(lesson.id);
                }}
              >
                开始
              </button>
            </li>
          ))}
        </ul>
      );
  }
}
