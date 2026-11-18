package com.fsieng.assessment.adapter.in.web;

import com.fsieng.assessment.application.port.in.AssessSpeakingUseCase;
import com.fsieng.assessment.application.port.in.AssessWritingUseCase;
import com.fsieng.assessment.domain.AudioClip;
import com.fsieng.assessment.domain.WritingSubmission;
import com.fsieng.assessment.domain.WritingTask;
import jakarta.validation.Valid;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Objects;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** AI-estimated IELTS scores. The frontend never calls a model; it calls these endpoints. */
@RestController
@RequestMapping("/api/assessment")
public class AssessmentController {

  private final AssessWritingUseCase writing;
  private final AssessSpeakingUseCase speaking;

  public AssessmentController(AssessWritingUseCase writing, AssessSpeakingUseCase speaking) {
    this.writing = writing;
    this.speaking = speaking;
  }

  @PostMapping("/writing")
  public AssessmentResponse writing(@Valid @RequestBody WritingRequest request) {
    WritingSubmission submission =
        new WritingSubmission(
            WritingTask.fromCode(request.task()), request.prompt(), request.essay());
    return AssessmentResponse.from(writing.assessWriting(submission));
  }

  @PostMapping(path = "/speaking", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public AssessmentResponse speaking(
      @RequestParam("part") int part,
      @RequestParam("question") String question,
      @RequestPart("audio") MultipartFile audio) {
    AudioClip clip;
    try {
      clip =
          new AudioClip(
              audio.getBytes(), Objects.requireNonNullElse(audio.getOriginalFilename(), "answer"));
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
    return AssessmentResponse.from(speaking.assessSpeaking(part, question, clip));
  }
}
