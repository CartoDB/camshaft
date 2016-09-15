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
