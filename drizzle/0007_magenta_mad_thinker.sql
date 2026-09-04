ALTER TABLE `projects` ADD `share_token` text;--> statement-breakpoint
CREATE UNIQUE INDEX `projects_share_token_uidx` ON `projects` (`share_token`);