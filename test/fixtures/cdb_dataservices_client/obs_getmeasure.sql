CREATE OR REPLACE FUNCTION cdb_dataservices_client._OBS_GetMeta_exception_safe(
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

CREATE OR REPLACE FUNCTION cdb_dataservices_client._OBS_GetData_exception_safe(
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
