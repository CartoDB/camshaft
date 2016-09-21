-- reescribir, que esto es una copia de cdb_contour sin editar

CREATE SCHEMA IF NOT EXISTS cdb_crankshaft;

CREATE OR REPLACE FUNCTION cdb_crankshaft.CDB_SpatialInterpolation(
    IN geomin geometry[],
    IN colin numeric[],
    IN point geometry,
    IN method integer DEFAULT 1,
    IN p1 numeric DEFAULT 0,
    IN p2 numeric DEFAULT 0
    )
RETURNS numeric AS $$
BEGIN
    RETURN (p1 * p2 * method::numeric * colin[1]);
END;
$$ language plpgsql;
