-- Enable RLS on every application table exposed through Supabase's public schema.
-- No client policies are added; browser roles therefore receive no table access.
DO $$
DECLARE
  table_record record;
BEGIN
  FOR table_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', 'public', table_record.tablename);
  END LOOP;
END
$$;
