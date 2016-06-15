SELECT input_query.*, moran.*
FROM ({{=it._query}}) input_query, (
  SELECT * FROM
  cdb_crankshaft.CDB_AreasOfInterestLocal(
    '{{=it._query}}',
    '{{=it._numeratorColumn}}',
    '{{=it._wType}}',
    {{=it._neighbours}},
    {{=it._permutations}},
    'the_geom',
    'cartodb_id'
  )
) moran
WHERE moran.rowid = input_query.cartodb_id
