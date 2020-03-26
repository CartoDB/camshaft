# Changelog

## 0.65.4
Release 2020-mm-dd

- Minor changes in the tests to create the geomval type, if necessary, in the cdb_dataservices_client schema. This is done to match the behaviour of that extension.

## 0.65.3
Release 2020-03-05

- Stop using two different tools for package management, testing, and any other developer workflow.
  - Removes Makefile and related bash scripts
  - Use npm scripts as the only tool for testing, CI and linting.
- Removed `jshint` as linter in favour of `eslint` to check syntax, find problems, and enforce code style.
- Fix noisy message logs while checking analyses' limits.
- Fix CI setup, explicit use of PGPORT while creating the PostgreSQL cluster.

## 0.65.2
Release 2020-02-17

- Fix uncatched error during sqlWrappedNode.createTableQuery (#397)

## 0.65.1
Release 2019-12-02

- Enforce the usage of cartodb schema.

## 0.65.0
Release 2019-11-25

- Update `request` to `^2.85.0`.
- Use plpython3u when testing against PG12+.
- Use quoted identifiers for column names.
- package-lock.json: Minor updates.

## 0.64.2
Release 2019-09-13

- Update `cartodb-query-tables` to version [`0.6.1`](https://github.com/CartoDB/node-cartodb-query-tables/blob/8dda0e1fb7292840c4ac381f9be2eb3976d180a1/NEWS.md#version-061).

## 0.64.1
Release 2019-09-13

* Update `cartodb-query-tables` to version [`0.6.0`](https://github.com/CartoDB/node-cartodb-query-tables/blob/0964b6cce5d3d3e149af8d6685e2fe7fa87a3d32/NEWS.md#version-060).
* Update `cartodb-psql` to version [`0.14.0`](https://github.com/CartoDB/node-cartodb-psql/blob/d8dae1d9726da7fb96806062247649fd6fb3c2f4/NEWS.md#version-0140-2019-09-10).


## 0.64.0
Release 2019-03-29
  - Drop support for Node.js 6 and 8
  - Drop support for Postgres 9.5
  - Fix `uncaught exception` while building node's query
  - Refresh file streams in logger when a signal hang up received, fixes #383

## 0.63.4
Release 2019-02-13
  - Fix for unhandled exception introduced on some errors in 0.63.2

## 0.63.3
Release 2019-02-12
  - Improve error message for exceeded batch SQL API payload size: add suggestions about what the user can do about it.

## 0.63.2
Release 2018-12-19
  - Specific error message for exceeded batch SQL API payload size

## 0.63.1
Release 2018-12-13
  - Update cartodb-psql to 0.13.1

## 0.63.0
Release 2018-11-21
  - Support Node.js 10
  - Add package.json
  - Update cartodb-psql@0.13.0
  - Support package-lock.json

## 0.62.4
Release 2018-10-26
  - Make all modules to use strict mode semantics.

## 0.62.3
Release 2018-08-03
  - Added metadata columns from street level geocoding.

## 0.62.2
Release 2018-08-02
  - Compute node's output columns from cached tables instead of final query to avoid missing columns when the schema of any analysis changes.

## 0.62.1
Release 2018-07-25
  - Remove metadata columns from street level geocoding.


## 0.62.0
Release 2018-07-19
  - Add a .npmignore to reduce size of npm package.
  - Add support for batch street-level geocoding analysis.

## 0.61.11
Released 2018-06-19:
  - Quote name columns when performing trade area analysis to avoid Syntax Errors

## 0.61.10
Released 2018-05-28:
  - Update `cartodb-psql` to 0.11.0

## 0.61.9
Released 2018-05-17:
  - Use Dollar-Quoted String Constants to avoid Syntax Error while running moran analyses.

## 0.61.8
Released 2018-03-16:
  - Republish for npm

## 0.61.7
Released 2018-03-16:
  - Revert: `Merge: Update version` (0.61.6)
  - Revert: `Merge: Avoid issues when mixing left and right joins` (0.61.4)

## 0.61.6
Released 2018-03-15
  - Merge: Update version

## 0.61.5
Released 2018-03-15
  - TradeArea: Update version

## 0.61.4
Released 2018-03-14
  - Merge: Make sure the output 'cartodb_id' is unique
  - Merge: Allow chained merge analyses
  - TradeArea: Allow chained analyses
  - Update request to 2.85.0

## 0.61.3
Released 2018-03-12
  - TradeArea: Make sure the output 'cartodb_id' is unique

## 0.61.2
Released 2018-02-08
  - Fix: compute line-sequential length properly as geodesic distance in meters

## 0.61.1
Released 2018-02-06
  - Revert adding the_geom_webmercator to merge node query

## 0.61.0
Released 2018-02-02
  - Adding the_geom_webmercator to merge node query

## 0.60.0
Released 2017-12-12
 - Using a partial index over the geometry column of the cached table #346.


## 0.59.4
Released 2017-10-18

- Extended filter-range analyses with new params:
  - greater than or equal (equivalent to min)
  - less than or equal (equivalent to max)

## 0.59.3
Released 2017-10-16

- Extended filter-range analyses, splitting "is greater than", and "is less than" with inclusive and exclusive options

## 0.59.2
Released 2017-10-03

- Upgrade debug to 3.x.

## 0.59.1
Released 2017-09-25

- Fix duplicate column names in aggregate-intersection

## 0.59.0
Released 2017-09-25

- Allow zoom, x, y, bbox query variables.


## 0.58.1
Released 2017-09-01

- Fixed postal geocoding analysis making it use points as the default output geometry
  which has far better coverage


## 0.58.0
Released 2017-08-31

- Changes in limits (https://github.com/CartoDB/camshaft/pull/327)
  - Added new kind of limit that takes into account numer of input rows multiplied
    by the number of possible categories
  - Added logging for all the limit errors
  - Change the closest analysis limit to take into account the following formula
    number of imput rows * categories * number of results.


## 0.57.0
Released 2017-08-24

- Add beforeCreate hook for the analysis in order to let the analyses execute some arbitrary
  async function at instantiation time. See https://github.com/CartoDB/camshaft/pull/326

## 0.56.0
Released 2017-08-23

- Add preexecute hooks for the analysis in order to let the analyses execute some arbitrary
  condition at execution time. See https://github.com/CartoDB/camshaft/pull/317


## 0.55.8
Released 2017-08-22

- Ensure unique cartodb using multiple isolines in analysis. See https://github.com/CartoDB/cartodb/issues/11916


## 0.55.7
Released 2017-08-13

- Upgrade cartodb-psql to [0.10.1](https://github.com/CartoDB/node-cartodb-psql/releases/tag/0.10.1).


## 0.55.6
Released 2017-06-22

- Add limits for "Find closest" (nearest) analysis. See https://github.com/CartoDB/camshaft/issues/290

## 0.55.5
Released 2017-06-16

- Revert change in the DO analysis where geomvals where moved to the _summary CTE to avoid possible problems

## 0.55.4
Released 2017-06-15

- Fixed issue to filter NULL geometries in the DO node queries because could cause errors in the data calculation from DO #312


## 0.55.3
Released 2017-06-06

- Fix issue to not lose original geometries from source when DO does not have data to enrich in legacy DO node analysis #308


## 0.55.2
Released 2017-05-24

- Fixed issue when passing null as string param ("null") to get metadata from DO.


## 0.55.1
Released 2017-05-23

- Removed `target column` parameter from sequenatial routing analysis
- Fixed how we get `the_geom` column in all the routing functions
- Do not lose original geometries from source when DO does not have data to enrich
- Use `exception-safe` wrappers for `data-observatory-*` nodes


## 0.55.0
Released 2017-05-22

 - New `data-observatory-multiple-measures` node.


## 0.54.4

Released 2017-05-11
 - Fix missing `node_id` when an error happens on analysis creation


## 0.54.3

Released 2017-05-09
 - Fix reference's graph to handle optional node params.


## 0.54.2

Released 2017-05-05
 - Upgrade cartodb-psql to [0.8.0](https://github.com/CartoDB/node-cartodb-psql/releases/tag/0.8.0).


## 0.54.1

Released 2017-04-24

 - Improvements over `closest` analysis: guarantee uniqueness of cartodb_id.


## 0.54.0

Released 2017-04-20

 - New `deprecated-sql-function` node.


## 0.53.1

Released 2017-04-11

 - Fix issue with an Invalid Date while fetching metadata from affected tables #282.


## 0.53.0

Released 2017-04-10

 - Now `Node` keeps track of the affected tables #269.


## 0.52.0

Released 2017-04-07

 - Closest analysis with multiple and categorized results.


## 0.51.0

Released 2017-04-03

 - Template support for georeference-street-address' address param.


## 0.50.3

Released 2017-03-10

- Revert "Cache `filter-by-node-column` and `merge` nodes" from 0.50.2.

## 0.50.2

Released 2017-02-23

- Fixes id column name clash on data-observatory node.
- Cache `filter-by-node-column` and `merge` nodes.

## 0.50.1

Released 2017-02-21

- Run ANALYZE on cache tables upon creation #260

## 0.50.0

Released 2017-02-20

- Improved data observatory analysis using new observatory, OBS_GetData and OBS_GetMeta, functions

## 0.49.0

Released 2017-01-18

- Support Node v6


## 0.48.5

Released 2016-12-19

- Use DS exception safe API functions #243
- `.travis.yml` improvements: Add postgis addon, Use trusty


## 0.48.4

Released 2016-11-30

- Cast updated_at column to ::timestamp to avoid UNION types errors.


## 0.48.3

Released 2016-11-23

- Fix bug preventing line-sequential limits in some cases


## 0.48.2

Released 2016-11-23

- Enhanced analysis pre-checking usig EXPLAIN
- Avoid duplicated input nodes at topsort level


## 0.48.1

Released 2016-11-10

- Fix incorrect analysis limit for aggregate-intersection


## 0.48.0

Released 2016-11-10

- Analysis requirements are checked before registration


## 0.47.0

Released 2016-11-08

- Buffer returns `cartodb_id` when using dissolved option
- Make mandatory `order_colum` and `order_type` params for line-sequential analysis


## 0.46.3

Released 2016-11-04

- Fix issue while sorting and validating analysis


## 0.46.2

Released 2016-11-01

- Expose `node_id` when cycle error is found


## 0.46.1

Released 2016-10-25

- Fix race condition during analysis creation


## 0.46.0

Released 2016-10-19

- Call SQL function `CDB_CheckAnalysisQuota` each time an analysis cache table is populated


## 0.45.0

Released 2016-10-11

 - Allow to set timeouts per analysis tag.
 - Allow to set timeouts per analysis type.


## 0.44.2

Released 2016-09-30

 - Log nodes with info about queued work.


## 0.44.1

Released 2016-09-28

 - Basic logging: Log once collected analysis data


## 0.44.0

Released 2016-09-26

 - Add contour analysis #186
 - Add gravity analysis #172
 - Basic logging to track analysis #192


## 0.43.0

Released 2016-09-14

 - Returns `cartodb_id` column for trade-area whether dissolved is enabled
 - Uses `test-helper` utility in acceptance test
 - Transforms `2D cartesian distance` to `kilometers` for column length in connect with lines analyses
 - Adds `category_column` to connect with lines (sequential) analysis

## 0.42.2

Released 2016-09-09

 - Put back vals column in moram analysis #195.


## 0.42.1

Released 2016-09-07

 - Cache `buffer` results: buffer+intersection anti-pattern is quite expensive otherwise.


## 0.42.0

Released 2016-09-06

 - Adds column length to connect with lines analyses #187.
 - Fixes connect with lines analysis, now closest option connects to the closest geometry for each source geometry #188.

## 0.41.0

Released 2016-08-23

 - Added Connect with Lines analyses.
 - Added Group point analyses.


## 0.40.0

Released 2016-08-16

 - Add closest features finding #171.
 - Change to use agnostic functions for isochrones and geocode-street #165.
 - Node model exposes method to determine if it's out of date from its input nodes.


## 0.39.0

Released 2016-08-09

 - Lazy nodes: skip filters from parent nodes and apply themselves.
 - Freeze last updated time for queries/tables not found by CDB_QueryTables_Updated_At #143.


## 0.38.1

Released 2016-07-21

 - Fixes missing `cartodb_id` column in merge analysis.


## 0.38.0

Released 2016-07-21

 - Set order clause in AOI analysis to render polygons big-to-small
 - Now in intersection analysis client is able to specify source columns.


## 0.37.1

Released 2016-07-18

 - Changed default value for trade-area provider.


## 0.37.0

Released 2016-07-15

 - Fixed issues in geocoding analysis:
 - Allowed to use column values and custom tests in params
 - Created a separated analysis for country geocoding
 - Made optional some params and used different geocoding functions depending on input params.


## 0.36.0

Released 2016-07-11

 - Added `node_id` param to errors in node creation to specify the exact node where the error happened


## 0.35.0

Released 2016-07-08

 - Node gets last error message from analysis catalog database.


## 0.34.0

Released 2016-07-07

 - Trade Area accepts provider service as input param


## 0.33.3

Released 2016-07-06

 - Avoid creating the same table from factory.


## 0.33.2

Released 2016-07-06

 - Fixes validation for nodes: it was failing when a node was missing from the definition.


## 0.33.1

Released 2016-07-06

 - Cache `intersection` and `aggregate-intersection` analyses.
 - Fixed column naming in aggregate intersection analysis.


## 0.33.0

Released 2016-07-06

 - Now SQL functions are fully qualified #113
 - Georeference Street Address has a param to choose the 3rd party service to look up


## 0.32.0

Released 2016-07-05

 - Added column density in aggregate intersection analysis.


## 0.31.0

Released 2016-07-05

 - Use internal version for backwards incompatible releases.


## 0.30.0

Released 2016-07-05

 - Limit cached table names to 60 chars #122.


## 0.29.2

Released 2016-07-05

 - Cache filter-grouped-rank analysis as it needs full knowledge of the table it.


## 0.29.1

Released 2016-07-05

 - Cached tables don't get recreated when applying a filter #535.
 - Cache filter-rank analysis as it needs full knowledge of the table it.


## 0.29.0

Released 2016-07-04

 - Adds merge analysis.


## 0.28.1

Released 2016-07-04

 - Make kmeans analysis consistent between runs #116.


## 0.28.0

Released 2016-07-04

 - Store errors in new analysis catalog table #109.


## 0.27.0

Released 2016-07-04

 - Adds routing analyses
 - Adds rank filters (all and grouped rankings)


## 0.26.0

Released 2016-07-04

 - Make the aggregation_column param of the aggreagation-intersection optional when the operation is `count` #102.
 - Improves cached nodes and filters inner working: cache table target name independent from filters #114.
 - Adds markov analysis #112.
 - Skips retrieval of last update time for root source nodes #110


## 0.25.0

Released 2016-07-02

 - Skip retrieval of last update time for root source nodes.
 - Allow to skip retrieval of last update in database service.


## 0.24.0

Released 2016-07-02

 - Nodes now has owners, the owner modifies the node.id.
   - This is a BREAKING CHANGE: clients need to provide a user in configuration.
 - Ignore duplicated node ids when registering them, allowing several clients to run in parallel.
 - Allow to have attributes that modifies node.id() without getting into json #103.


## 0.23.0

Released 2016-06-30

 - Allow any geometry in weighted-centroid #100.


## 0.22.4

Released 2016-06-28

 - Ignore unique_violation error (23505) on table creation.


## 0.22.3

Released 2016-06-28

 - Reverse intersection and aggregate-intersection st_intersects geometry intersection.


## 0.22.2

Released 2016-06-28

 - Use a transaction to delete/insert into cache tables.


## 0.22.1

Released 2016-06-28

 - Intersection nodes gets augmented with columns from target node #95.
 - Automatically populate nodes from nodes directory, no need to add them manually.


## 0.22.0

Released 2016-06-24

 - Adds centroid analysis #87.
 - Make weighted-centroid's category_column param optional #88.


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
