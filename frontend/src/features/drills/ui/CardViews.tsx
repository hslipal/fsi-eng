import { useState, type ReactElement } from 'react';
import { DRILL_TYPE_LABELS, VERDICT_LABELS, type Card, type Feedback } from '../model/practice';

function Prompt({ card }: { readonly card: Card }): ReactElement {
  return (
    <>
      <p>
        {DRILL_TYPE_LABELS[card.type]} · {card.title}
      </p>
      <p>{card.instruction}</p>
      {card.model === null ? null : <p>例句：{card.model}</p>}
      {card.passage === null ? null : (
        <blockquote aria-label="阅读文章">
          {card.passage.split('\n\n').map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </blockquote>
      )}
      <p>
        提示：<strong>{card.cue}</strong>
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
        <label>
          你的答案
          <input
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value);
            }}
          />
        </label>
      )}
      <button type="submit" disabled={answer.trim().length === 0}>
        提交
      </button>
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
    <fieldset>
      <legend>选择答案</legend>
      {options.map((option) => (
        <label key={option}>
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
      <p role="status">{VERDICT_LABELS[feedback.verdict]}</p>
      <p>参考答案：{feedback.expected}</p>
      <p>记忆盒 {feedback.box}/5</p>
      <button type="button" onClick={onNext}>
        下一题
      </button>
    </div>
  );
}
