# Changelog

## 0.21.1

Released 2016-mm-dd


## 0.21.0

Released 2016-06-23

 - Add Filter rank analysis #75.
 - Generate cartodb_id in weighted-centroid analysis #72.
 - Add Convex hull analysis #76.


## 0.20.0

Released 2016-06-22

 - Link by line analysis #67.
 - Fix regression on incorrect cycles for dag #74.


## 0.19.0

Released 2016-06-21

 - Adds georeference analyses:
  - Longitude latitude
  - Admin region
  - City
  - Street address
  - Postal code
  - IP address


## 0.18.0

Released 2016-06-20

 - Add support for points in moran.


## 0.17.1

Released 2016-06-15

 - Improves some queries avoiding CTE usages.


## 0.17.0

Released 2016-06-15

 - Adds aggregation options in weighted-centroid.


## 0.16.0

Released 2016-06-15

 - Fix moran queries:
   - Use a custom filter for significance param, ignore significance for cache table.
   - Use `Rate` when denominator is provided.
   - Make neighbours and permutations params optional.
 - Add method to ignore param for the node id generation
 - Replace `validate` with `beforeCreate` option to modify nodes before create/return them
 - Option to bump version an force analysis recalculation.
 - Optional params are casted to null when not provided.


## 0.15.1

Released 2016-06-14

 - Release with latest reference updated


## 0.15.0

Released 2016-06-13

 - Adds filter by node column analysis


## 0.14.1

Released 2016-06-10

 - Use new CDB_WeightedMean aggregate function #49


## 0.14.0

Released 2016-06-10

 - Removes isolines constraint for dissolved option in buffer analysis
 - Adds analyses: kmeans, weighted-centroid, data-observatory-measure


## 0.13.0

Released 2016-06-03

 - Export version from package


## 0.12.1

Released 2016-06-01

 - Fix filter-range and filter-category nodes


## 0.12.0

Released 2016-06-01

 - Add support to filter dates by range


## 0.11.0

Released 2016-05-30

 - Fixes for node status: #32 and #33
 - New public method to retrieve all nodes from an analysis #31


## 0.10.0

Released 2016-05-27

 - Add `isolines` and `dissolved` optional params to buffer #26


## 0.9.0

Released 2016-05-27

 - NODE param provides a list of accepted geometries for the analysis.


## 0.8.0

Released 2016-05-11

 - Public Node.getFilters method


## 0.7.0

Released 2016-05-11

 - Filter by category analysis #23
 - Filter by range analysis #22
 - Option to validate node before being returned #21
 - Add support for array params #20
 - Avoid Node class creation with reserved keywords #19
 - Allow to have optional/nullable params #18


## 0.6.0

Released 2016-05-03

 - Added intersection and aggregate-intersection analyses
 - Added trade-area analysis


## 0.5.1

Released 2016-04-29

 - Decouple workflow factory from camshaft-reference
 - Fixes Analysis.getSortedNodes/toposort including root node when is the only node #12


## 0.5.0

Released 2016-04-20

 - Add param to configure batch api host header template


## 0.4.0

Released 2016-04-20
