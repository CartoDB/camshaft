CREATE OR REPLACE FUNCTION cdb_isochrone(center GEOMETRY, kind TEXT, range INTEGER[], OUT center geometry, OUT data_range integer, OUT the_geom geometry)
AS $$
  SELECT
    $1 center,
    _t.radius data_range,
    ST_Buffer($1, _t.radius * 0.001) as the_geom
  FROM (
    SELECT unnest($3) as radius
  ) _t
$$ LANGUAGE 'sql' IMMUTABLE STRICT;
