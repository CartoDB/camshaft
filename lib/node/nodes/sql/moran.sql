SELECT input_query.*, m.quads, m.significance, m.moran, m.vals
FROM ({{=it._query}}) input_query, (
  SELECT * FROM
  cdb_crankshaft.CDB_AreasOfInterestLocal(
    $cdb_aoil_source_query${{=it._query}}$cdb_aoil_source_query$,
    '{{=it._numeratorColumn}}',
    '{{=it._wType}}',
    {{=it._neighbours}},
    {{=it._permutations}},
    'the_geom',
    'cartodb_id'
  )
) m
WHERE m.rowid = input_query.cartodb_id
