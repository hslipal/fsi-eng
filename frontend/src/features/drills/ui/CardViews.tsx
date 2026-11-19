import { useState, type ReactElement } from 'react';
import { DRILL_TYPE_LABELS, VERDICT_LABELS, type Card, type Feedback } from '../model/practice';

function Prompt({ card }: { readonly card: Card }): ReactElement {
  return (
    <>
      <p className="drill-kind">
        <span className="drill-type">{DRILL_TYPE_LABELS[card.type]}</span>
        <span className="drill-title">{card.title}</span>
      </p>
      <p className="drill-instruction">{card.instruction}</p>
      {card.model === null || card.base !== null ? null : (
        <p className="drill-model">例句：{card.model}</p>
      )}
      {card.base === null ? null : <p className="drill-model">上一句：{card.base}</p>}
      {card.passage === null ? null : (
        <blockquote className="passage" aria-label="阅读文章">
          {card.passage.split('\n\n').map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </blockquote>
      )}
      <p className="drill-cue">
        <span className="drill-cue-label">{card.options.length > 0 ? '题目' : '提示'}</span>
        <strong className="drill-slot">{card.cue}</strong>
      </p>
    </>
  );
}

interface QuestionProps {
  readonly card: Card;
  readonly onSubmit: (answer: string) => Promise<void>;
}

export function QuestionView({ card, onSubmit }: QuestionProps): ReactElement {
  const [answer, setAnswer] = useState('');
  return (
    <form
      aria-label="作答"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(answer);
      }}
    >
      <Prompt card={card} />
      {card.options.length > 0 ? (
        <ChoiceInput options={card.options} value={answer} onChange={setAnswer} />
      ) : (
        <label className="answer">
          你的答案
          <input
            value={answer}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              setAnswer(event.target.value);
            }}
          />
        </label>
      )}
      <div className="actions">
        <button className="button" type="submit" disabled={answer.trim().length === 0}>
          提交
        </button>
      </div>
    </form>
  );
}

interface ChoiceProps {
  readonly options: readonly string[];
  readonly value: string;
  readonly onChange: (value: string) => void;
}

function ChoiceInput({ options, value, onChange }: ChoiceProps): ReactElement {
  return (
    <fieldset className="choices">
      <legend>选择答案</legend>
      {options.map((option) => (
        <label key={option} className="choice">
          <input
            type="radio"
            name="choice"
            value={option}
            checked={value === option}
            onChange={() => {
              onChange(option);
            }}
          />
          {option}
        </label>
      ))}
    </fieldset>
  );
}

interface FeedbackProps {
  readonly card: Card;
  readonly feedback: Feedback;
  readonly onNext: () => void;
}

export function FeedbackView({ card, feedback, onNext }: FeedbackProps): ReactElement {
  return (
    <div>
      <Prompt card={card} />
      <p role="status" className={`verdict verdict-${feedback.verdict}`}>
        {VERDICT_LABELS[feedback.verdict]}
      </p>
      <p className="expected">参考答案：{feedback.expected}</p>
      <p className="box-note">记忆盒 {feedback.box}/5</p>
      <div className="actions">
        <button className="button" type="button" onClick={onNext}>
          下一题
        </button>
      </div>
    </div>
  );
}
