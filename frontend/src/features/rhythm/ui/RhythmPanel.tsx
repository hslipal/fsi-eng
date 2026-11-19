import { useMemo, useState, type ReactElement } from 'react';
import { STEP_LABELS, TRACK_LABELS, TRACKS, type LessonSummary, type Track } from '../model/lesson';
import { REPETITION_CHOICES } from '../model/plan';
import { DEFAULT_LIMIT_SECONDS, LIMIT_CHOICES, type InputMode } from '../model/rhythm';
import { useLessons } from '../model/useLesson';
import { browserSpeaker, RATE_CHOICES, type Speaker } from '../model/voice';
import { LessonRunner, type RhythmSettings } from './LessonRunner';

interface PanelProps {
  /** Reads aloud; defaults to the browser's speech synthesis. Returning null means silent. */
  readonly makeSpeaker?: (rate: number) => Speaker | null;
}

const DEFAULTS: RhythmSettings = {
  limitSeconds: DEFAULT_LIMIT_SECONDS,
  repetitions: 20,
  mode: 'tape',
  autoAdvance: true,
  rate: 1,
};

/** FSI pattern drills at speed: one lesson, each drill type many times, against the clock. */
export function RhythmPanel({ makeSpeaker = browserSpeaker }: PanelProps): ReactElement {
  const [track, setTrack] = useState<Track>('business');
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [settings, setSettings] = useState<RhythmSettings>(DEFAULTS);
  const speaker = useMemo(() => makeSpeaker(settings.rate), [makeSpeaker, settings.rate]);

  return (
    <section className="panel" aria-labelledby="rhythm-title">
      <h2 id="rhythm-title">节奏训练</h2>
      <p className="panel-lead">
        {`FSI 磁带式操练：听提示，在停顿里大声说出整句，再听标准答案、跟读一遍、给自己打分。每种练习连续做 ${String(settings.repetitions)} 次。`}
      </p>
      {lessonId === null ? (
        <>
          <Settings settings={settings} canSpeak={speaker !== null} onChange={setSettings} />
          <TrackTabs track={track} onChange={setTrack} />
          <LessonList track={track} onPick={setLessonId} />
        </>
      ) : (
        <LessonRunner
          key={lessonId}
          lessonId={lessonId}
          settings={settings}
          speaker={speaker}
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
  readonly canSpeak: boolean;
  readonly onChange: (settings: RhythmSettings) => void;
}

const MODE_LABELS: Readonly<Record<InputMode, string>> = {
  tape: '开口说，自己打分',
  typing: '打字，自动判分',
};

interface Choice {
  readonly value: string;
  readonly label: string;
}

function Select({
  label,
  value,
  choices,
  onPick,
}: {
  readonly label: string;
  readonly value: string;
  readonly choices: readonly Choice[];
  readonly onPick: (value: string) => void;
}): ReactElement {
  return (
    <label className="field">
      {label}
      <select
        value={value}
        onChange={(event) => {
          onPick(event.target.value);
        }}
      >
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Settings({ settings, canSpeak, onChange }: SettingsProps): ReactElement {
  const tape = settings.mode === 'tape';
  return (
    <fieldset className="rhythm-settings">
      <legend>练习设置</legend>
      <Select
        label="作答方式"
        value={settings.mode}
        choices={(['tape', 'typing'] as const).map((mode) => ({
          value: mode,
          label: MODE_LABELS[mode],
        }))}
        onPick={(value) => {
          onChange({ ...settings, mode: value === 'typing' ? 'typing' : 'tape' });
        }}
      />
      <Select
        label={tape ? '停顿' : '限时'}
        value={String(settings.limitSeconds)}
        choices={LIMIT_CHOICES.map((seconds) => ({
          value: String(seconds),
          label: `${String(seconds)} 秒`,
        }))}
        onPick={(value) => {
          onChange({ ...settings, limitSeconds: Number(value) });
        }}
      />
      <Select
        label="每种练习"
        value={String(settings.repetitions)}
        choices={REPETITION_CHOICES.map((count) => ({
          value: String(count),
          label: `${String(count)} 次`,
        }))}
        onPick={(value) => {
          onChange({ ...settings, repetitions: Number(value) });
        }}
      />
      <Select
        label="朗读语速"
        value={String(settings.rate)}
        choices={RATE_CHOICES.map((rate) => ({ value: String(rate.value), label: rate.label }))}
        onPick={(value) => {
          onChange({ ...settings, rate: Number(value) });
        }}
      />
      {tape ? null : <PageTurn settings={settings} onChange={onChange} />}
      <SettingsNote canSpeak={canSpeak} />
    </fieldset>
  );
}

function PageTurn({ settings, onChange }: Omit<SettingsProps, 'canSpeak'>): ReactElement {
  return (
    <Select
      label="翻页"
      value={settings.autoAdvance ? 'auto' : 'manual'}
      choices={[
        { value: 'auto', label: '答完自动翻页' },
        { value: 'manual', label: '点「下一题」翻页' },
      ]}
      onPick={(value) => {
        onChange({ ...settings, autoAdvance: value === 'auto' });
      }}
    />
  );
}

function SettingsNote({ canSpeak }: { readonly canSpeak: boolean }): ReactElement {
  return (
    <p className="rhythm-note">
      {canSpeak
        ? '提示和标准答案由浏览器朗读（不录音、不上传）。快捷键：空格 = 说完了，1/2/3 = 打分，R = 再听一遍。'
        : '这个浏览器不能朗读，只显示文字。快捷键：空格 = 说完了，1/2/3 = 打分。'}
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
              <span className="library-meta">
                {stepsText(lesson)}
                {lesson.devOnly ? <span className="dev-badge">开发素材</span> : null}
              </span>
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
