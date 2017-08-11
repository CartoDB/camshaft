CREATE OR REPLACE FUNCTION cdb_dataservices_client._OBS_PreCheck(
    source_query text,
    parameters json
) RETURNS boolean AS $$
BEGIN
  RETURN TRUE;
END;
$$ LANGUAGE 'plpgsql' IMMUTABLE STRICT;
