import type { ReactElement } from 'react';
import { CRITERION_LABELS, type Assessment, type Criterion } from '../model/assessment';

/** An AI-estimated score. Always labelled as an estimate, always with the disclaimer. */
export function ScoreCard({ result }: { readonly result: Assessment }): ReactElement {
  return (
    <article className="score" aria-labelledby="score-title">
      <h3 id="score-title">AI 估计分数（非官方）</h3>
      <p className="score-overall">估计总分：{result.overallBand.toFixed(1)}</p>
      <ul className="bands" aria-label="各项估计">
        {result.criteria.map((score) => (
          <BandRow
            key={score.criterion}
            criterion={score.criterion}
            band={score.band}
            comment={score.comment}
          />
        ))}
        {result.skill === 'speaking' && !result.pronunciationScored ? (
          <li className="band-unscored">
            <div className="band-head">
              <span>{CRITERION_LABELS.pronunciation}</span>
              <span className="band-value">未评分</span>
            </div>
            <p className="band-comment">语音转文字无法判断发音。</p>
          </li>
        ) : null}
      </ul>
      <p className="score-summary">{result.summary}</p>
      {result.transcript === null ? null : (
        <p className="transcript">识别出的回答：{result.transcript}</p>
      )}
      <p className="disclaimer" role="note">
        {result.disclaimer}
      </p>
    </article>
  );
}

interface BandRowProps {
  readonly criterion: Criterion;
  readonly band: number;
  readonly comment: string;
}

function BandRow({ criterion, band, comment }: BandRowProps): ReactElement {
  return (
    <li>
      <div className="band-head">
        <span>{CRITERION_LABELS[criterion]}</span>
        <span className="band-value">{band.toFixed(1)}</span>
      </div>
      <div
        className="band-scale"
        role="meter"
        aria-label={CRITERION_LABELS[criterion]}
        aria-valuemin={0}
        aria-valuemax={9}
        aria-valuenow={band}
      >
        <span style={{ width: `${String((band / 9) * 100)}%` }} />
      </div>
      <p className="band-comment">{comment}</p>
    </li>
  );
}
