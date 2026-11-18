import { useState, type ReactElement } from 'react';
import { TRACK_LABELS, TRACKS, type Track } from '../model/practice';
import { usePracticeSession, type PracticeSession } from '../model/usePracticeSession';
import { FeedbackView, QuestionView } from './CardViews';

export function DrillPanel(): ReactElement {
  const [track, setTrack] = useState<Track>('business');
  const session = usePracticeSession(track);

  return (
    <section className="panel" aria-labelledby="drill-title">
      <h2 id="drill-title">句型操练</h2>
      <p className="panel-lead">
        看提示，说出或写出完整句子。答对的题会隔几天再出现，答错的很快会再练。
      </p>
      <div className="tabs" role="tablist" aria-label="操练赛道">
        {TRACKS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            className="tab"
            aria-selected={candidate === track}
            onClick={() => {
              setTrack(candidate);
            }}
          >
            {TRACK_LABELS[candidate]}
          </button>
        ))}
      </div>
      <SessionBody session={session} />
    </section>
  );
}

function SessionBody({ session }: { readonly session: PracticeSession }): ReactElement {
  const { state } = session;
  switch (state.kind) {
    case 'loading':
      return (
        <p className="status" role="status">
          加载中…
        </p>
      );
    case 'error':
      return (
        <p className="alert" role="alert">
          出错了：{state.message}
        </p>
      );
    case 'done':
      return state.answered === 0 ? (
        <p className="empty">这个赛道现在没有要练的题。</p>
      ) : (
        <p className="done">本轮练习完成，共 {state.answered} 题。</p>
      );
    case 'question':
      return (
        <div className="drill">
          <Progress position={state.position} total={state.total} />
          <QuestionView key={state.card.cardKey} card={state.card} onSubmit={session.submit} />
        </div>
      );
    case 'feedback':
      return (
        <div className="drill">
          <Progress position={state.position} total={state.total} />
          <FeedbackView card={state.card} feedback={state.feedback} onNext={session.next} />
        </div>
      );
  }
}

function Progress({
  position,
  total,
}: {
  readonly position: number;
  readonly total: number;
}): ReactElement {
  return (
    <div className="drill-progress">
      <span>
        第 {position}/{total} 题
      </span>
      <span className="drill-progress-bar" aria-hidden="true">
        <span style={{ width: `${String((position / total) * 100)}%` }} />
      </span>
    </div>
  );
}
