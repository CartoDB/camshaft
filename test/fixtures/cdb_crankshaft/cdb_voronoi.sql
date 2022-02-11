CREATE SCHEMA IF NOT EXISTS cdb_crankshaft;

CREATE OR REPLACE FUNCTION cdb_crankshaft.CDB_voronoi(
    IN geomin geometry[],
    IN buffer numeric DEFAULT 0.5,
    IN tolerance numeric DEFAULT 1e-9
)
RETURNS geometry  AS $$
DECLARE
    geomout geometry;
BEGIN
    SELECT ST_Buffer(ST_Centroid(ST_Collect(geomin)), buffer) INTO geomout;
    RETURN geomout;
END;
$$ language plpgsql IMMUTABLE;
