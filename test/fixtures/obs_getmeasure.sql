CREATE OR REPLACE FUNCTION cdb_dataservices_client.OBS_GetMeasure(
  geom geometry,
  segment_name text
)
RETURNS numeric
AS $$
BEGIN
  RETURN trunc(random() * 1e5 + 1);
END;
$$  LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION OBS_GetMeasure(
  geom geometry,
  segment_name text,
  denominator text
)
RETURNS numeric
AS $$
BEGIN
  RETURN trunc(random() * 100 + 1);
END;
$$  LANGUAGE plpgsql;
