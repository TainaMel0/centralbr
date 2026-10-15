CREATE TABLE `certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`equipment_id` text NOT NULL,
	`number` text NOT NULL,
	`calibrated_at` text NOT NULL,
	`next_at` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`file_name` text NOT NULL,
	`object_key` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_certificates_equipment_date` ON `certificates` (`equipment_id`,`calibrated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_certificates_number` ON `certificates` (`number`);--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`cnpj` text NOT NULL,
	`contact` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `equipment` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`brand` text DEFAULT '' NOT NULL,
	`model` text DEFAULT '' NOT NULL,
	`serial` text NOT NULL,
	`tag` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_equipment_company_serial` ON `equipment` (`company_id`,`serial`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_by` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `members` (
	`user_id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_members_company` ON `members` (`company_id`);--> statement-breakpoint
CREATE TABLE `portal_owner` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portal_owner_user_id_unique` ON `portal_owner` (`user_id`);