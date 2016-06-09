CREATE OR REPLACE FUNCTION OBS_GetMeasure(
  geom geometry,
  time_span text
)
RETURNS numeric
AS $$
BEGIN
  RETURN trunc(random() * 1e5 + 1);
END;
$$  LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION OBS_GetMeasure(
  geom geometry,
  time_span text,
  arg text
)
RETURNS numeric
AS $$
BEGIN
  RETURN trunc(random() * 100 + 1);
END;
$$  LANGUAGE plpgsql;
