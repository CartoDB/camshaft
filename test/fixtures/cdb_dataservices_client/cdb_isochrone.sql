CREATE TYPE cdb_dataservices_client.isoline AS (
    center geometry(Geometry,4326),
    data_range integer,
    the_geom geometry(Multipolygon,4326)
);

CREATE OR REPLACE FUNCTION cdb_dataservices_client._cdb_isochrone_exception_safe(source geometry(Geometry, 4326), mode text, range integer[], options text[] DEFAULT ARRAY[]::text[])
RETURNS SETOF cdb_dataservices_client.isoline
AS $$
  SELECT
    $1 center,
    _t.radius data_range,
    ST_Buffer($1::geography, _t.radius)::geometry as the_geom
  FROM (
    SELECT unnest($3) as radius
  ) _t
$$ LANGUAGE 'sql' IMMUTABLE STRICT;
