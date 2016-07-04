drop table if exists cdb_analysis_catalog;
create table cdb_analysis_catalog (
    -- useful for multi account deployments
    username text,
    -- md5 hex hash
    node_id char(40) CONSTRAINT cdb_analysis_catalog_pkey PRIMARY KEY,
    -- being json allows to do queries like analysis_def->>'type' = 'buffer'
    analysis_def json NOT NULL,
    -- can reference other nodes in this very same table, allowing recursive queries
    input_nodes char(40) ARRAY NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT valid_status CHECK (
        status IN ( 'pending', 'waiting', 'running', 'canceled', 'failed', 'ready' )
    ),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    -- should be updated when some operation was performed in the node
    -- and anything associated to it might have changed
    updated_at timestamp with time zone DEFAULT NULL,
    -- should register last time the node was used
    used_at timestamp with time zone NOT NULL DEFAULT now(),
    -- should register the number of times the node was used
    hits NUMERIC DEFAULT 0,
    -- should register what was the last node using current node
    last_used_from char(40),
    -- last job modifying the node
    last_modified_by uuid,
    -- store error message for failures
    last_error_message text
);

--GRANT SELECT, UPDATE, INSERT, DELETE ON TABLE cartodb.cdb_analysis_catalog TO "development_cartodb_user_359a4d9f-a063-4130-9674-799e90960886";
-- insert into cartodb.cdb_analysis_catalog (node_id, analysis_def, affected_tables) VALUES (
--     'bb72c4656df99ed98367889372f1e0752bf33e6a',
--     '{"type":"source","query":"select the_geom, listing_url, price from airbnb_madrid_oct_2015_listings"}'::json,
--     ARRAY['airbnb_madrid_oct_2015_listings'::regclass]
-- );
-- insert into cartodb.cdb_analysis_catalog (node_id, analysis_def, affected_tables) VALUES (
--     '9ffd2b3253b8b2703cacdf641f0b552623b50a2e',
--     '{"type":"source","query":"select * from atm_machines"}'::json,
--     ARRAY['atm_machines'::regclass]
-- );
-- insert into cartodb.cdb_analysis_catalog (node_id, input_nodes, analysis_def, affected_tables) VALUES (
--     'a0dcaef19b3ca54591e350737057ab37c9fc0396',
--     ARRAY['9ffd2b3253b8b2703cacdf641f0b552623b50a2e'],
--     '{"type":"trade-area","inputNodeId":"9ffd2b3253b8b2703cacdf641f0b552623b50a2e","kind":"walk","time":1200}'::json,
--     '{}'
-- );
--
-- insert into cartodb.cdb_analysis_catalog (node_id, input_nodes, analysis_def, affected_tables) VALUES (
--     '3e14790377947fb3c0066b01de7053249183bd88',
--     ARRAY['bb72c4656df99ed98367889372f1e0752bf33e6a', 'a0dcaef19b3ca54591e350737057ab37c9fc0396'],
--     '{"type":"point-in-polygon","pointsNodeId":"bb72c4656df99ed98367889372f1e0752bf33e6a","polygonsNodeNodeId":"a0dcaef19b3ca54591e350737057ab37c9fc0396"}'::json,
--     '{}'
-- );
--








-- WITH RECURSIVE search_dag(node_id, input_nodes) AS (
--     select node_id, input_nodes from cdb_analysis_catalog where node_id = 'a0dcaef19b3ca54591e350737057ab37c9fc0396'
--     UNION
--     -- recursive
--     SELECT c.node_id, c.input_nodes
--     FROM search_dag s, cdb_analysis_catalog c
--     WHERE c.node_id = ANY(s.input_nodes)
-- )
-- select * from search_dag;
--
-- WITH RECURSIVE search_dag(node_id, input_nodes) AS (
--     select node_id, input_nodes, affected_tables from cdb_analysis_catalog where node_id = '3e14790377947fb3c0066b01de7053249183bd88'
--     UNION
--     -- recursive
--     SELECT c.node_id, c.input_nodes, c.affected_tables
--     FROM search_dag s, cdb_analysis_catalog c
--     WHERE c.node_id = ANY(s.input_nodes)
-- )
-- select unnest(affected_tables) from search_dag;
--
--
--
--
--
--
--
--
-- WITH upsert AS (
--     UPDATE cartodb.cdb_analysis_catalog
--     SET
--         used_at = NOW(),
--         hits = hits + 1
--     WHERE node_id = '3e14790377947fb3c0066b01de7053249183bd88'
--     RETURNING *
-- )
-- INSERT INTO cartodb.cdb_analysis_catalog (node_id, input_nodes, analysis_def, affected_tables)
--     SELECT
--         '3e14790377947fb3c0066b01de7053249183bd88',
--         ARRAY['bb72c4656df99ed98367889372f1e0752bf33e6a', 'a0dcaef19b3ca54591e350737057ab37c9fc0396'],
--         '{"type":"point-in-polygon","pointsNodeId":"bb72c4656df99ed98367889372f1e0752bf33e6a","polygonsNodeNodeId":"a0dcaef19b3ca54591e350737057ab37c9fc0396"}'::json,
--         '{}'
--     WHERE NOT EXISTS (SELECT * FROM upsert);
--
--
--
--
--
--
--
--
--
--
-- WITH
-- RECURSIVE search_dag(node_id, input_nodes) AS (
--     select node_id, input_nodes from cdb_analysis_catalog where node_id IN ('bb72c4656df99ed98367889372f1e0752bf33e6a', 'a0dcaef19b3ca54591e350737057ab37c9fc0396')
--     UNION
--     -- recursive
--     SELECT c.node_id, c.input_nodes
--     FROM search_dag s, cdb_analysis_catalog c
--     WHERE c.node_id = ANY(s.input_nodes)
-- ),
-- update_input_nodes AS (
--         UPDATE cartodb.cdb_analysis_catalog
--         SET
--             used_at = NOW(),
--             hits = hits + 1
--         WHERE node_id IN (select node_id from search_dag)
--     ),
-- upsert AS (
--         UPDATE cartodb.cdb_analysis_catalog
--         SET
--             used_at = NOW(),
--             hits = hits + 1
--         WHERE node_id = '3e14790377947fb3c0066b01de7053249183bd88'
--         RETURNING *
--     )
-- INSERT INTO cartodb.cdb_analysis_catalog (node_id, input_nodes, analysis_def, affected_tables)
--     SELECT
--         '3e14790377947fb3c0066b01de7053249183bd88',
--         ARRAY['bb72c4656df99ed98367889372f1e0752bf33e6a', 'a0dcaef19b3ca54591e350737057ab37c9fc0396'],
--         '{"type":"point-in-polygon","pointsNodeId":"bb72c4656df99ed98367889372f1e0752bf33e6a","polygonsNodeNodeId":"a0dcaef19b3ca54591e350737057ab37c9fc0396"}'::json,
--         '{}'
--     WHERE NOT EXISTS (SELECT * FROM upsert);

-- Filter by analysis type
-- SELECT * FROM cdb_analysis_catalog WHERE analysis_def->>'type' = 'trade-area'
