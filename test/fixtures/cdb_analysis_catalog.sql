drop table if exists cdb_analysis_catalog;
create table cdb_analysis_catalog (
    node_id char(40) CONSTRAINT cdb_analysis_catalog_pkey PRIMARY KEY,
    analysis_def json NOT NULL,
    input_nodes char(40) ARRAY NOT NULL DEFAULT '{}',
    affected_tables regclass[] NOT NULL DEFAULT '{}',
    cache_tables regclass[] NOT NULL DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    used_at timestamp with time zone NOT NULL DEFAULT now(),
    hits NUMERIC DEFAULT 0,
    last_used_from char(40)
);
