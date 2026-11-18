import { useState, type ReactElement } from 'react';
import { TRACK_LABELS, TRACKS, type Track } from '../model/practice';
import { usePracticeSession, type PracticeSession } from '../model/usePracticeSession';
import { FeedbackView, QuestionView } from './CardViews';

export function DrillPanel(): ReactElement {
  const [track, setTrack] = useState<Track>('business');
  const session = usePracticeSession(track);

  return (
    <section aria-labelledby="drill-title">
      <h2 id="drill-title">句型操练</h2>
      <div role="tablist" aria-label="操练赛道">
        {TRACKS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
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
      return <p role="status">加载中…</p>;
    case 'error':
      return <p role="alert">出错了：{state.message}</p>;
    case 'done':
      return state.answered === 0 ? (
        <p>这个赛道现在没有要练的题。</p>
      ) : (
        <p>本轮练习完成，共 {state.answered} 题。</p>
      );
    case 'question':
      return (
        <>
          <p>
            第 {state.position}/{state.total} 题
          </p>
          <QuestionView key={state.card.cardKey} card={state.card} onSubmit={session.submit} />
        </>
      );
    case 'feedback':
      return <FeedbackView card={state.card} feedback={state.feedback} onNext={session.next} />;
  }
}
