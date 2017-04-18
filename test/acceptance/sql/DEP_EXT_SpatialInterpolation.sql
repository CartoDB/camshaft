CREATE OR REPLACE FUNCTION DEP_EXT_SpatialInterpolation(
        source_query text, source_columns text[],
        target_query text, target_columns text[],
        val_column text,
        method numeric, -- 0=nearest neighbor, 1=barymetric, 2=IDW
        number_of_neighbors numeric, -- DEFAULT 0, -- 0=unlimited
        decay_order numeric, -- DEFAULT 0,
        table_name text,
        operation text
    )
    RETURNS VOID AS $$
        BEGIN
            IF operation = 'create' THEN
                EXECUTE 'CREATE TABLE ' || table_name || ' AS ' ||
                    -- The table will have the schema of target query but with an extra column from the source query.
                    'SELECT _target.*, _source.' || val_column ||
                    ' FROM (' || target_query || ') _target, (' || source_query || ') _source LIMIT 0';
            ELSIF operation = 'populate' THEN
                EXECUTE 'INSERT INTO ' || table_name || ' ' ||
                    'WITH ' ||
                    '_target AS (' || target_query || '),' ||
                    '_source AS (' ||
                    '  SELECT array_agg(the_geom) as _geo,' ||
                    '  array_agg( ' || val_column || '::numeric ) as _values' ||
                    '  FROM (' || source_query || ') _s' ||
                    '  WHERE ' || val_column || ' is not null' ||
                    ')' ||
                    'SELECT _target.*,' ||
                    '  cdb_crankshaft.CDB_MockSpatialInterpolation(' ||
                    '    _source._geo,' ||
                    '    _source._values,' ||
                    '    CASE WHEN GeometryType(_target.the_geom) = ''POINT'' THEN _target.the_geom ELSE ST_Centroid(_target.the_geom) END,' ||
                    '    ' || method || ','
                    '    ' || number_of_neighbors || ','
                    '    ' || decay_order || ''
                    '  ) AS ' || val_column || ' '
                    'FROM _target, _source';
            END IF;
        END;
$$ LANGUAGE plpgsql;
