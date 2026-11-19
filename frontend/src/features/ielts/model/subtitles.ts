import { z } from 'zod';

export const SubtitleLineSchema = z.object({
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  text: z.string(),
  /** Chinese; null when the line has not been translated. */
  translation: z.string().nullable(),
});
export type SubtitleLine = z.infer<typeof SubtitleLineSchema>;

export const SubtitlesSchema = z.object({ lines: z.array(SubtitleLineSchema) });

/** Which layers of the subtitles are shown. */
export interface SubtitleLayers {
  readonly english: boolean;
  readonly chinese: boolean;
}

/** The line being spoken at `seconds`, or -1 before the first and in gaps between lines. */
export function activeLine(lines: readonly SubtitleLine[], seconds: number): number {
  return lines.findIndex((line) => seconds >= line.start && seconds < line.end);
}
