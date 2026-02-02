-- Add approved_by column to admin_requests if it doesn't exist
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name = 'admin_requests' and column_name = 'approved_by') then 
        alter table public.admin_requests add column approved_by text; 
    end if; 
end $$;
