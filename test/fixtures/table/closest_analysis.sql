CREATE TABLE IF NOT EXISTS closest_analysis_source AS
WITH sources AS (
    select i as cartodb_id, st_setsrid(st_makepoint(i,0), 4326) as the_geom
    from generate_series(1,3) as i
)
SELECT *, st_x(the_geom) as x, st_y(the_geom) as y FROM sources;

CREATE TABLE IF NOT EXISTS closest_analysis_target AS
WITH targets AS (
    select row_number() over() as cartodb_id,
           chr(64 + (i % 4)) as category,
           st_translate(the_geom, 0, i*.1) as the_geom
    FROM closest_analysis_source, generate_series(1,3) as i
)
SELECT *, st_x(the_geom) as x, st_y(the_geom) as y from targets;
