package com.fsieng.practice.domain;

/** The verdict and the accepted answer closest to what the learner wrote. */
public record Grade(Verdict verdict, String expected) {}
