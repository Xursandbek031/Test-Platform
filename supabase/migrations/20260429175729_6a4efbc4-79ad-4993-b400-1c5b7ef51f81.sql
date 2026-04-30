-- Lock down SECURITY DEFINER functions from public/anon execution
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Tighten results insert: validate test exists & is published instead of WITH CHECK (true)
drop policy if exists "Anyone can submit results" on public.results;
create policy "Anyone can submit results for published tests" on public.results
  for insert with check (
    exists (select 1 from public.tests t where t.id = test_id and t.is_published = true)
  );