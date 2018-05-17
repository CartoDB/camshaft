CREATE SCHEMA IF NOT EXISTS cdb_crankshaft;

CREATE OR REPLACE FUNCTION
  cdb_crankshaft.CDB_AreasOfInterestLocal(
      subquery TEXT,
      column_name TEXT,
      w_type TEXT,
      num_ngbrs INT,
      permutations INT,
      geom_col TEXT,
      id_col TEXT)
RETURNS TABLE (
    moran NUMERIC,
    quads TEXT,
    significance NUMERIC,
    rowid INT,
    vals NUMERIC)
AS $$
BEGIN
    EXECUTE subquery;
    SELECT 1, 'QUADS', 0.01, 1, 1;
END
$$ LANGUAGE plpgsql;
