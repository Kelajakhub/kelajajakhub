revoke all on function public.purge_old_messages() from public;
revoke all on function public.purge_old_messages() from anon;
revoke all on function public.purge_old_messages() from authenticated;
grant execute on function public.purge_old_messages() to service_role;