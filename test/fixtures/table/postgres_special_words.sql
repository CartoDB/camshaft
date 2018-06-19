CREATE TABLE postgres_special_words (
    cartodb_id integer NOT NULL,
    the_geom geometry(Geometry,4326),
    the_geom_webmercator geometry(Geometry,3857),
    "window" text,
    "zone" text,
    "dash-and space" text
);

ALTER TABLE ONLY postgres_special_words
    ADD CONSTRAINT postgres_special_words_pkey PRIMARY KEY (cartodb_id);

CREATE INDEX postgres_special_words_the_geom_idx ON postgres_special_words USING gist (the_geom);

CREATE INDEX postgres_special_words_the_geom_webmercator_idx ON postgres_special_words USING gist (the_geom_webmercator);
