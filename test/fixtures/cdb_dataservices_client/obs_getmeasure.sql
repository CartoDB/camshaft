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
  IF json_array_length(params) > 0 AND params->0->>'numer_id' = 'test.cast.text' THEN
    RETURN '[{"numer_id": "test.cast.text", "numer_type": "Text"}]'::json;
  END IF;
  RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql;

-- Create geomval if it doesn't exist (in postgis 3+ it only exists in postgis_raster)
-- Uses cdb_dataservices_client.geomval to match the behaviour followed there
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geomval') THEN
        CREATE TYPE cdb_dataservices_client.geomval AS (
            geom geometry,
            val double precision
        );
    END IF;
END$$;

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
