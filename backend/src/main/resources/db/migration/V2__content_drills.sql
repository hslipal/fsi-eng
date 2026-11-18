-- Drills of a content item, stored as JSON in the same shape as content/*.json "drills".
ALTER TABLE content_item ADD COLUMN drills_json VARCHAR(1000000) NOT NULL DEFAULT '[]';
