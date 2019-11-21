DO $$
BEGIN
    IF current_setting('server_version_num')::integer > 120000 THEN
        CREATE EXTENSION plpython3u;
    ELSE
        CREATE EXTENSION plpythonu;
    END IF;
END$$;