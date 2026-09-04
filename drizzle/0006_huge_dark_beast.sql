ALTER TABLE `assets` ADD `checksum` text;--> statement-breakpoint
CREATE INDEX `assets_project_checksum_idx` ON `assets` (`project_id`,`checksum`);