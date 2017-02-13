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

CREATE OR REPLACE FUNCTION cdb_dataservices_client.OBS_GetMeasure(
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

CREATE OR REPLACE FUNCTION cdb_dataservices_client.OBS_GetMeta(
  geom_ref Geometry(Geometry, 4326),
  params json,
  max_timespan_rank integer DEFAULT NULL,
  max_score_rank integer DEFAULT NULL,
  target_geoms integer DEFAULT NULL
)
RETURNS json
AS $$
BEGIN
  RETURN '{}'::json;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cdb_dataservices_client.obs_getdata(
  geomvals geomval[],
  params json,
  merge boolean DEFAULT true
)
RETURNS TABLE(
  id int,
  data json)
AS $$
BEGIN
  RETURN QUERY EXECUTE $query$
    SELECT 1, '{}'::JSON
  $query$;
  RETURN;
END;
$$ LANGUAGE plpgsql;
