create schema if not exists cdb_crankshaft;

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

CREATE OR REPLACE FUNCTION cdb_crankshaft.CDB_WeightedMeanS(state Numeric[],the_geom GEOMETRY(Point, 4326), weight NUMERIC)
    RETURNS Numeric[] AS
    $$
DECLARE
    newX NUMERIC;
    newY NUMERIC;
    newW NUMERIC;
BEGIN
    IF weight IS NULL OR the_geom IS NULL THEN
        newX = state[1];
        newY = state[2];
        newW = state[3];
    ELSE
        newX = state[1] + ST_X(the_geom)*weight;
        newY = state[2] + ST_Y(the_geom)*weight;
        newW = state[3] + weight;
    END IF;
    RETURN Array[newX,newY,newW];

END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cdb_crankshaft.CDB_WeightedMeanF(state Numeric[])
    RETURNS GEOMETRY AS
    $$
BEGIN
    IF state[3] = 0 THEN
        RETURN ST_SetSRID(ST_MakePoint(state[1],state[2]), 4326);
    ELSE
        RETURN ST_SETSRID(ST_MakePoint(state[1]/state[3], state[2]/state[3]),4326);
    END IF;
END
$$ LANGUAGE plpgsql;

CREATE AGGREGATE cdb_crankshaft.CDB_WeightedMean(geometry(Point, 4326), NUMERIC)(
SFUNC = cdb_crankshaft.CDB_WeightedMeanS,
FINALFUNC = cdb_crankshaft.CDB_WeightedMeanF,
STYPE = Numeric[],
INITCOND = "{0.0,0.0,0.0}"
);
