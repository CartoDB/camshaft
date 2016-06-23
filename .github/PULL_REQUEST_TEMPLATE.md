For new analysis use the following checklist:

- [ ] Outputs a `the_geom geometry(Geometry, 4326)` column.
- [ ] Outputs a `cartodb_id numeric` column.
- [ ] Uses `{cache: true}` option when it needs full knowledge of the table it. Hints: aggregations, window functions.
- [ ] Uses `{cache: true}` if it access external services.
- [ ] Naming uses a-z lowercase and hyphens.
- [ ] All mandatory params cannot be made optional.
