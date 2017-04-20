CREATE OR REPLACE FUNCTION DEP_EXT_SpatialInterpolation(
        operation text,
        table_name text,
        source_query text, source_columns text[],
        target_query text, target_columns text[],
        val_column text,
        method numeric, -- 0=nearest neighbor, 1=barymetric, 2=IDW
        number_of_neighbors numeric, -- DEFAULT 0, -- 0=unlimited
        decay_order numeric -- DEFAULT 0,
    )
    RETURNS VOID AS $$
        BEGIN
            IF method < 0 OR method > 2 THEN
                RAISE EXCEPTION 'Invalid method value=%', buster
                    USING HINT = 'Valid ones are: 0=nearest neighbor, 1=barymetric, 2=IDW';
            END IF;
            IF operation = 'create' THEN
                -- The table will have the schema of target query but with an extra column from the source query.
                EXECUTE format(
                    'CREATE TABLE %I AS SELECT _target.*, _source.%I FROM (%s) _target, (%s) _source LIMIT 0',
                    table_name, val_column, target_query, source_query
                );
            ELSIF operation = 'populate' THEN
                EXECUTE format($populate_query$
                    INSERT INTO %I
                    WITH
                    _target AS (%s),
                    _source AS (
                      SELECT array_agg(the_geom) as _geo,
                      array_agg( %I::numeric ) as _values
                      FROM (%s) _s
                      WHERE %I is not null
                    )
                    SELECT _target.*,
                      cdb_crankshaft.CDB_MockSpatialInterpolation(
                        _source._geo,
                        _source._values,
                        CASE WHEN GeometryType(_target.the_geom) = 'POINT' THEN _target.the_geom ELSE ST_Centroid(_target.the_geom) END,
                        $1,
                        $2,
                        $3
                      ) AS %I
                    FROM _target, _source
                    $populate_query$,
                    table_name, target_query, val_column, source_query, val_column, val_column
                ) USING method::int, number_of_neighbors, decay_order;
            END IF;
        END;
$$ LANGUAGE plpgsql;
