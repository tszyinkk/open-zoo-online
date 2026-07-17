CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`creator_hash` text NOT NULL,
	`host_player_id` text NOT NULL,
	`status` text DEFAULT 'lobby' NOT NULL,
	`marine_worlds` integer DEFAULT false NOT NULL,
	`game_state` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_code_unique` ON `rooms` (`code`);
--> statement-breakpoint
CREATE INDEX `rooms_created_idx` ON `rooms` (`creator_hash`,`created_at`);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`seat` integer NOT NULL,
	`token_hash` text NOT NULL,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_room_seat_unique` ON `players` (`room_id`,`seat`);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_token_unique` ON `players` (`token_hash`);
--> statement-breakpoint
CREATE INDEX `players_room_idx` ON `players` (`room_id`,`seat`);
