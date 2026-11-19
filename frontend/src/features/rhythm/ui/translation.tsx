import { useContext, type ReactElement } from 'react';
import { TranslationVisible } from '../model/translationVisible';

/** A Chinese line under an English one; nothing when hidden or untranslated. */
export function Translation({ text }: { readonly text: string | null }): ReactElement | null {
  const visible = useContext(TranslationVisible);
  if (!visible || text === null) {
    return null;
  }
  return <p className="translation-line">{text}</p>;
}

export function TranslationToggle({
  visible,
  onToggle,
}: {
  readonly visible: boolean;
  readonly onToggle: () => void;
}): ReactElement {
  return (
    <button type="button" className="layer-toggle" aria-pressed={visible} onClick={onToggle}>
      中文翻译（T）
    </button>
  );
}
