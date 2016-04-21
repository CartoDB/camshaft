CREATE OR REPLACE FUNCTION cdb_isochrone(center GEOMETRY, kind TEXT, range INTEGER[])
RETURNS SETOF GEOMETRY
AS $$
  SELECT
    ST_Collect(_b.geom) as geom
  FROM (
    SELECT
      ST_Buffer(ST_SetSRID($1::geometry, 4326), _t.radius) as geom
    FROM (
      SELECT unnest($3) as radius
    ) _t
  ) _b
$$ LANGUAGE 'sql' IMMUTABLE STRICT;
