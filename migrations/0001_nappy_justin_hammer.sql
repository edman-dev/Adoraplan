CREATE TYPE "public"."event_pattern" AS ENUM('daily', 'weekly', 'monthly', 'yearly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('one_time', 'recurring', 'series');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('technical_issue', 'spiritual_impact', 'improvement_suggestion', 'general');--> statement-breakpoint
CREATE TYPE "public"."hymn_status" AS ENUM('authorized', 'not_reviewed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."hymn_type" AS ENUM('official', 'user_created', 'public');--> statement-breakpoint
CREATE TYPE "public"."program_status" AS ENUM('draft', 'published', 'completed');--> statement-breakpoint
CREATE TYPE "public"."worship_role" AS ENUM('admin', 'worship_leader', 'pastor', 'collaborator');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "churches" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"address" text,
	"timezone" varchar(100) DEFAULT 'UTC',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"event_date" timestamp NOT NULL,
	"duration" integer DEFAULT 90,
	"event_type" "event_type" DEFAULT 'one_time' NOT NULL,
	"recurring_pattern" "event_pattern",
	"recurring_config" json,
	"series_id" integer,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"program_id" integer,
	"user_id" text NOT NULL,
	"feedback_type" "feedback_type" NOT NULL,
	"rating" integer,
	"title" varchar(255),
	"message" text NOT NULL,
	"suggestions" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp,
	"resolution" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hymns" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"author" varchar(255),
	"composer" varchar(255),
	"year" integer,
	"copyright" text,
	"hymn_type" "hymn_type" DEFAULT 'user_created' NOT NULL,
	"status" "hymn_status" DEFAULT 'not_reviewed' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"categories" json,
	"themes" json,
	"doctrines" json,
	"languages" json,
	"lyrics" json,
	"audio_files" json,
	"sync_data" json,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ministries" (
	"id" serial PRIMARY KEY NOT NULL,
	"church_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(7) DEFAULT '#3B82F6',
	"icon" varchar(100) DEFAULT 'music',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"related_entity_type" varchar(50),
	"related_entity_id" integer,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"action_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "program_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"role" varchar(100) NOT NULL,
	"notes" text,
	"is_confirmed" boolean DEFAULT false NOT NULL,
	"confirmed_at" timestamp,
	"assigned_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "program_hymns" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"hymn_id" integer NOT NULL,
	"order_index" integer NOT NULL,
	"notes" text,
	"key" varchar(10),
	"tempo" varchar(50),
	"estimated_duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "program_version_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"version_number" integer NOT NULL,
	"markdown_content" text NOT NULL,
	"change_description" text,
	"changed_by" text NOT NULL,
	"change_type" varchar(50) DEFAULT 'manual_edit',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"ministry_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"default_duration" integer DEFAULT 90,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"church_count" integer DEFAULT 0 NOT NULL,
	"ministry_count" integer DEFAULT 0 NOT NULL,
	"collaborator_count" integer DEFAULT 0 NOT NULL,
	"events_this_week" integer DEFAULT 0 NOT NULL,
	"events_this_month" integer DEFAULT 0 NOT NULL,
	"storage_used_mb" integer DEFAULT 0 NOT NULL,
	"last_calculated_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_worship_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"church_id" integer,
	"role" "worship_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"assigned_by" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "worship_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "program_status" DEFAULT 'draft' NOT NULL,
	"program_data" json,
	"markdown_content" text,
	"original_markdown" text,
	"version_number" integer DEFAULT 1 NOT NULL,
	"last_edited_by" text,
	"last_edited_at" timestamp,
	"approved_by" text,
	"approved_at" timestamp,
	"created_by" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "churches" ADD CONSTRAINT "churches_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback" ADD CONSTRAINT "feedback_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback" ADD CONSTRAINT "feedback_program_id_worship_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."worship_programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hymns" ADD CONSTRAINT "hymns_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ministries" ADD CONSTRAINT "ministries_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_assignments" ADD CONSTRAINT "program_assignments_program_id_worship_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."worship_programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_hymns" ADD CONSTRAINT "program_hymns_program_id_worship_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."worship_programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_hymns" ADD CONSTRAINT "program_hymns_hymn_id_hymns_id_fk" FOREIGN KEY ("hymn_id") REFERENCES "public"."hymns"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_version_history" ADD CONSTRAINT "program_version_history_program_id_worship_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."worship_programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "services" ADD CONSTRAINT "services_ministry_id_ministries_id_fk" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_usage" ADD CONSTRAINT "subscription_usage_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_worship_roles" ADD CONSTRAINT "user_worship_roles_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_worship_roles" ADD CONSTRAINT "user_worship_roles_church_id_churches_id_fk" FOREIGN KEY ("church_id") REFERENCES "public"."churches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "worship_programs" ADD CONSTRAINT "worship_programs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "churches_organization_idx" ON "churches" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "churches_name_idx" ON "churches" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "churches_active_idx" ON "churches" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "churches_created_by_idx" ON "churches" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "churches_created_at_idx" ON "churches" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "churches_org_active_idx" ON "churches" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_service_idx" ON "events" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_date_idx" ON "events" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_type_idx" ON "events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_series_idx" ON "events" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_completed_idx" ON "events" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_created_by_idx" ON "events" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_created_at_idx" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_service_date_idx" ON "events" USING btree ("service_id","event_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_date_type_idx" ON "events" USING btree ("event_date","event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_date_completed_idx" ON "events" USING btree ("event_date","is_completed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_upcoming_idx" ON "events" USING btree ("event_date","is_completed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_event_idx" ON "feedback" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_program_idx" ON "feedback" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_user_idx" ON "feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_type_idx" ON "feedback" USING btree ("feedback_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_rating_idx" ON "feedback" USING btree ("rating");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_resolved_idx" ON "feedback" USING btree ("is_resolved");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_resolved_by_idx" ON "feedback" USING btree ("resolved_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_created_at_idx" ON "feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_event_resolved_idx" ON "feedback" USING btree ("event_id","is_resolved");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_type_rating_idx" ON "feedback" USING btree ("feedback_type","rating");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_event_type_idx" ON "feedback" USING btree ("event_id","feedback_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hymns_organization_idx" ON "hymns" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hymns_title_idx" ON "hymns" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hymns_type_idx" ON "hymns" USING btree ("hymn_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hymns_status_idx" ON "hymns" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hymns_public_idx" ON "hymns" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hymns_created_by_idx" ON "hymns" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hymns_author_idx" ON "hymns" USING btree ("author");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hymns_usage_count_idx" ON "hymns" USING btree ("usage_count");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hymns_created_at_idx" ON "hymns" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hymns_org_type_idx" ON "hymns" USING btree ("organization_id","hymn_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hymns_public_status_idx" ON "hymns" USING btree ("is_public","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hymns_title_author_idx" ON "hymns" USING btree ("title","author");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hymns_popular_idx" ON "hymns" USING btree ("usage_count","organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ministries_church_idx" ON "ministries" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ministries_name_idx" ON "ministries" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ministries_active_idx" ON "ministries" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ministries_created_by_idx" ON "ministries" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ministries_created_at_idx" ON "ministries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ministries_church_active_idx" ON "ministries" USING btree ("church_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_organization_idx" ON "notifications" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_created_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_related_entity_idx" ON "notifications" USING btree ("related_entity_type","related_entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_org_read_idx" ON "notifications" USING btree ("user_id","organization_id","is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignments_program_idx" ON "program_assignments" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignments_user_idx" ON "program_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignments_role_idx" ON "program_assignments" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignments_confirmed_idx" ON "program_assignments" USING btree ("is_confirmed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "program_hymns_program_idx" ON "program_hymns" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "program_hymns_hymn_idx" ON "program_hymns" USING btree ("hymn_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "program_hymns_order_idx" ON "program_hymns" USING btree ("order_index");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_program_hymn_order" ON "program_hymns" USING btree ("program_id","order_index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "version_history_program_idx" ON "program_version_history" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "version_history_version_idx" ON "program_version_history" USING btree ("version_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "version_history_changed_by_idx" ON "program_version_history" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "version_history_created_idx" ON "program_version_history" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_program_version" ON "program_version_history" USING btree ("program_id","version_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_ministry_idx" ON "services" USING btree ("ministry_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_name_idx" ON "services" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_active_idx" ON "services" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_created_by_idx" ON "services" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_created_at_idx" ON "services" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_ministry_active_idx" ON "services" USING btree ("ministry_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "usage_organization_idx" ON "subscription_usage" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_last_calculated_idx" ON "subscription_usage" USING btree ("last_calculated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_user_org_idx" ON "user_worship_roles" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_church_idx" ON "user_worship_roles" USING btree ("church_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_role_idx" ON "user_worship_roles" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_active_idx" ON "user_worship_roles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_assigned_by_idx" ON "user_worship_roles" USING btree ("assigned_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_assigned_at_idx" ON "user_worship_roles" USING btree ("assigned_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_user_active_idx" ON "user_worship_roles" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_org_active_idx" ON "user_worship_roles" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_user_org_active_idx" ON "user_worship_roles" USING btree ("user_id","organization_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_roles_church_active_idx" ON "user_worship_roles" USING btree ("church_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_org_role" ON "user_worship_roles" USING btree ("user_id","organization_id","role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programs_event_idx" ON "worship_programs" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programs_status_idx" ON "worship_programs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programs_created_by_idx" ON "worship_programs" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programs_approved_by_idx" ON "worship_programs" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programs_last_edited_by_idx" ON "worship_programs" USING btree ("last_edited_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programs_version_idx" ON "worship_programs" USING btree ("version_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programs_created_at_idx" ON "worship_programs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programs_last_edited_at_idx" ON "worship_programs" USING btree ("last_edited_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programs_approved_at_idx" ON "worship_programs" USING btree ("approved_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programs_event_status_idx" ON "worship_programs" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "programs_status_approved_idx" ON "worship_programs" USING btree ("status","approved_by");