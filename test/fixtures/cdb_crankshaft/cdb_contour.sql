CREATE SCHEMA IF NOT EXISTS cdb_crankshaft;

CREATE OR REPLACE FUNCTION cdb_crankshaft.CDB_Contour(
    IN geomin geometry[],
    IN colin numeric[],
    IN buffer numeric,
    IN intmethod integer,
    IN classmethod integer,
    IN steps integer,
    IN max_time integer DEFAULT 60000
    )
RETURNS TABLE(
    the_geom geometry,
    bin integer,
    min_value numeric,
    max_value numeric,
    avg_value numeric
)  AS $$
BEGIN
    RETURN QUERY
    WITH a AS(
        SELECT
        *
        FROM
        unnest(geomin, colin) WITH ORDINALITY as t(geom, av, b)
    )
    SELECT
        geom as the_geom,
        b::integer as bin,
        av::numeric as avg_value,
        (floor(av))::numeric as min_value,
        (ceil(av))::numeric as max_value
    FROM a
    WHERE b <= steps;
END;
$$ language plpgsql;