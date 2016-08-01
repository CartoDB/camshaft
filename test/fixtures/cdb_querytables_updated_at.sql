CREATE OR REPLACE FUNCTION CDB_QueryTables_Updated_At(query text)
    RETURNS TABLE(dbname text, schema_name text, table_name text, updated_at timestamptz)
AS $$
    SELECT
    'analysis_api_test_db'::text,
    'public'::text,
    'table_name'::text,
    CASE WHEN position('nulltime' in query) > 0
        THEN null::timestamptz
        ELSE '2016-07-01 11:40:05.699712+00'::timestamptz
    END
$$ LANGUAGE SQL;
