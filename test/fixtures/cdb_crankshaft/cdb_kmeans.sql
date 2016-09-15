CREATE TYPE kmeans_type as (cartodb_id numeric, cluster_no numeric);

CREATE OR REPLACE FUNCTION cdb_crankshaft.CDB_KMeans(query text, no_clusters integer,no_init integer default 20)
    RETURNS setof kmeans_type as $$
    DECLARE r kmeans_type;
    BEGIN
    FOR r IN EXECUTE format('select cartodb_id, ceil(random() * 10) AS cluster_no from (%s) _cdb_query', query) loop
        RETURN NEXT r;
    END LOOP;
    RETURN;
    END;
$$ LANGUAGE plpgsql;

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
