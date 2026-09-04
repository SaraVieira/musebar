-- Boards made public before share_token existed have no token, which leaves
-- them unreachable via /s/ while their assets stay anonymously readable.
-- Give each one a token so "shared" means the same thing everywhere.
UPDATE `projects`
SET `share_token` = lower(hex(randomblob(24)))
WHERE `public` = 1 AND `share_token` IS NULL;
