-- Read-only verification helper. Run in a disposable Supabase SQL session with
-- two authenticated JWT contexts; never run this against production as a write.
-- Replace the UUIDs and execute each block as the corresponding user.

-- User A must only see A's project and feedback:
-- SELECT set_config('request.jwt.claim.sub', '<USER_A_UUID>', true);
-- SELECT f.id, f.site_id FROM public.feedback_items f
-- WHERE f.site_id IN ('<SITE_A_UUID>', '<SITE_B_UUID>');
-- Expected: only rows for SITE_A_UUID.

-- User B must only see B's project and feedback:
-- SELECT set_config('request.jwt.claim.sub', '<USER_B_UUID>', true);
-- SELECT f.id, f.site_id FROM public.feedback_items f
-- WHERE f.site_id IN ('<SITE_A_UUID>', '<SITE_B_UUID>');
-- Expected: only rows for SITE_B_UUID.

-- The same two checks should be repeated for feedback_syntheses and
-- feedback_recommendations. The application API checks ownership as well.
