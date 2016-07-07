CREATE OR REPLACE FUNCTION cdb_dataservices_client.cdb_isochrone(center GEOMETRY, kind TEXT, range INTEGER[], OUT center geometry, OUT data_range integer, OUT the_geom geometry)
AS $$
  SELECT
    $1 center,
    _t.radius data_range,
    ST_Buffer($1::geography, _t.radius)::geometry as the_geom
  FROM (
    SELECT unnest($3) as radius
  ) _t
$$ LANGUAGE 'sql' IMMUTABLE STRICT;

CREATE OR REPLACE FUNCTION cdb_dataservices_client.cdb_mapzen_isochrone(center GEOMETRY, kind TEXT, range INTEGER[], OUT center geometry, OUT data_range integer, OUT the_geom geometry)
AS $$
  SELECT
    $1 center,
    _t.radius data_range,
    ST_Buffer($1::geography, _t.radius)::geometry as the_geom
  FROM (
    SELECT unnest($3) as radius
  ) _t
$$ LANGUAGE 'sql' IMMUTABLE STRICT;
