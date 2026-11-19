package com.fsieng.content.application.service;

import com.fsieng.content.application.port.in.SpeakingPromptsUseCase;
import com.fsieng.content.application.port.out.LoadContentPort;
import com.fsieng.content.application.port.out.SampleAudioPort;
import com.fsieng.content.application.port.out.SubtitlesPort;
import com.fsieng.content.domain.ContentItem;
import com.fsieng.content.domain.ContentNotFoundException;
import com.fsieng.content.domain.Drill;
import com.fsieng.content.domain.License;
import com.fsieng.content.domain.SampleAudio;
import com.fsieng.content.domain.SpeakingPromptRef;
import com.fsieng.content.domain.Subtitles;
import com.fsieng.content.domain.Track;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * IELTS speaking questions from published content and, when {@code includeDevOnly} is on (dev
 * profile only), from dev-only material that has not been licensed yet.
 */
public final class SpeakingPromptsService implements SpeakingPromptsUseCase {

  private final LoadContentPort content;
  private final SampleAudioPort audio;
  private final SubtitlesPort subtitles;
  private final boolean includeDevOnly;

  public SpeakingPromptsService(
      LoadContentPort content,
      SampleAudioPort audio,
      SubtitlesPort subtitles,
      boolean includeDevOnly) {
    this.content = content;
    this.audio = audio;
    this.subtitles = subtitles;
    this.includeDevOnly = includeDevOnly;
  }

  /** Without subtitles. */
  public SpeakingPromptsService(
      LoadContentPort content, SampleAudioPort audio, boolean includeDevOnly) {
    this(content, audio, (license, path) -> Optional.empty(), includeDevOnly);
  }

  /** A prompt together with the license of the content it came from. */
  private record Located(SpeakingPromptRef ref, License license, Drill.SpeakingPrompt prompt) {}

  @Override
  public List<SpeakingPromptRef> list() {
    return located().stream().map(Located::ref).toList();
  }

  @Override
  public SampleAudio sample(String key) {
    Located found = find(key);
    String path = found.prompt().audio();
    if (path == null) {
      throw new ContentNotFoundException("sample answer of " + key);
    }
    return audio
        .read(found.license(), path)
        .orElseThrow(() -> new ContentNotFoundException("sample answer of " + key));
  }

  @Override
  public Subtitles subtitles(String key) {
    Located found = find(key);
    String path = found.prompt().audio();
    if (path == null) {
      throw new ContentNotFoundException("subtitles of " + key);
    }
    return subtitles
        .read(found.license(), path)
        .orElseThrow(() -> new ContentNotFoundException("subtitles of " + key));
  }

  private Located find(String key) {
    return located().stream()
        .filter(candidate -> candidate.ref().key().equals(key))
        .findFirst()
        .orElseThrow(() -> new ContentNotFoundException("speaking question " + key));
  }

  private boolean visible(ContentItem item) {
    return item.isPublishable() || (includeDevOnly && item.license() instanceof License.DevOnly);
  }

  private List<Located> located() {
    List<Located> result = new ArrayList<>();
    for (ContentItem item : content.loadByTrack(Track.IELTS)) {
      if (!visible(item)) {
        continue;
      }
      boolean devOnly = !item.license().publishable();
      for (int d = 0; d < item.drills().size(); d++) {
        if (item.drills().get(d) instanceof Drill.Speaking speaking) {
          for (int i = 0; i < speaking.prompts().size(); i++) {
            Drill.SpeakingPrompt prompt = speaking.prompts().get(i);
            String key = item.id().value() + ":" + d + ":" + i;
            SpeakingPromptRef ref =
                new SpeakingPromptRef(
                    key,
                    prompt.part(),
                    prompt.question(),
                    prompt.audio() != null,
                    prompt.seconds(),
                    devOnly);
            result.add(new Located(ref, item.license(), prompt));
          }
        }
      }
    }
    return result;
  }
}
