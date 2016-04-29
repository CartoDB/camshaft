SELECT
  {{=it.columns}},
  CDB_Population(the_geom) as {{=it.final_column}}
FROM (
  {{=it.source}}
) _camshaft_population_in_area

-- CDB_Population fake implementation
-- ---------------------------------------------------------------------------
-- CREATE FUNCTION CDB_Population(geometry) RETURNS numeric AS
-- 'select (random() * 1e6)::numeric;'
-- LANGUAGE SQL VOLATILE;
-- ---------------------------------------------------------------------------
