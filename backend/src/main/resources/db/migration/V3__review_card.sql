-- Leitner state of one drill item for one learner.
CREATE TABLE review_card (
    id         UUID                     PRIMARY KEY,
    learner_id VARCHAR(100)             NOT NULL,
    card_key   VARCHAR(200)             NOT NULL,
    box        INTEGER                  NOT NULL,
    due_at     TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT review_card_learner_card_uk UNIQUE (learner_id, card_key)
);
