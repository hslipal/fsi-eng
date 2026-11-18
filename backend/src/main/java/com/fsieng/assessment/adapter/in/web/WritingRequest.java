package com.fsieng.assessment.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WritingRequest(
    @NotBlank String task, @NotBlank @Size(max = 2_000) String prompt, @NotBlank String essay) {}
