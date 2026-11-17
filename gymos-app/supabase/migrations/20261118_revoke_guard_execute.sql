-- The two members trigger guards are called by the trigger mechanism only, never through the API.
-- PostgreSQL checks EXECUTE on a trigger function when the trigger is created, not when it fires,
-- so removing API execute rights changes nothing for the triggers and closes the RPC surface.
revoke execute on function public.members_leaderboard_guard() from public, anon, authenticated;
revoke execute on function public.members_referrer_guard()    from public, anon, authenticated;
