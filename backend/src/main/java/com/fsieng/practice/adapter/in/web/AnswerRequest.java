package com.fsieng.practice.adapter.in.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnswerRequest(@NotBlank String cardKey, @NotBlank @Size(max = 1000) String answer) {}
