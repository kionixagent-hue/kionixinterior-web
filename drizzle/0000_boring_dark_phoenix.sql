CREATE TYPE "public"."article_locale" AS ENUM('id', 'en');--> statement-breakpoint
CREATE TYPE "public"."article_status" AS ENUM('draft', 'in_review', 'published');--> statement-breakpoint
CREATE TYPE "public"."topic_status" AS ENUM('new', 'used', 'dismissed');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "article_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"locale" "article_locale" NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"quick_answer" text NOT NULL,
	"body" text NOT NULL,
	"meta_description" text NOT NULL,
	"faq" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "article_translations_locale_slug_unique" UNIQUE("locale","slug"),
	CONSTRAINT "article_translations_article_id_locale_unique" UNIQUE("article_id","locale")
);
--> statement-breakpoint
ALTER TABLE "article_translations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "article_status" DEFAULT 'draft' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"cover_image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword" text NOT NULL,
	"source" text DEFAULT 'google_trends' NOT NULL,
	"score" numeric,
	"discovered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "topic_status" DEFAULT 'new' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "topics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "article_translations" ADD CONSTRAINT "article_translations_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;