SELECT
  input_query.*,
  m.trend,
  m.trend_up,
  m.trend_down,
  m.volatility
FROM CDB_SpatialMarkovTrend('{{=it._query}}', Array[{{=it._time_columns}}]) As m
JOIN ({{=it._query}}) input_query
ON input_query.cartodb_id = m.rowid;
