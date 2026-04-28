CREATE TABLE IF NOT EXISTS "restaurant_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"customizations" jsonb DEFAULT '{}'::jsonb,
	"special_instructions" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurant_order_items" ADD CONSTRAINT "restaurant_order_items_order_id_restaurant_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."restaurant_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "restaurant_order_items" ADD CONSTRAINT "restaurant_order_items_menu_item_id_cms_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."cms_menu_items"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_restaurant_order_items_order_id" ON "restaurant_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_restaurant_order_items_menu_item_id" ON "restaurant_order_items" USING btree ("menu_item_id");