/**
 * Supabase Database Types (generated via Supabase MCP)
 * Project: buffrhost (cjmtcxfpwjbpbctjseex)
 * Regenerate: use Supabase MCP generate_types or Dashboard → API → Generate types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          channel: string
          context: Json | null
          created_at: string | null
          guest_id: string | null
          id: string
          property_id: string | null
          session_id: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          channel: string
          context?: Json | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          property_id?: string | null
          session_id?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string
          context?: Json | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          property_id?: string | null
          session_id?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_guest_id_guests_id_fk"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_ai_conversations_id_fk"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_trail: {
        Row: {
          action: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          session_id: string | null
          tenant_id: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          tenant_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          tenant_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_trail_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_rooms: {
        Row: {
          booking_id: string | null
          created_at: string | null
          currency: string | null
          guest_count: number | null
          id: string
          rate_amount: number
          room_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          guest_count?: number | null
          id?: string
          rate_amount: number
          room_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          guest_count?: number | null
          id?: string
          rate_amount?: number
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_rooms_booking_id_bookings_id_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_rooms_room_id_rooms_id_fk"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          actual_check_in_date: string | null
          actual_check_out_date: string | null
          adult_count: number | null
          ai_confidence_score: number | null
          ai_processed: boolean | null
          booking_reference: string
          cancellation_policy: string | null
          check_in_date: string
          check_out_date: string
          child_count: number | null
          created_at: string | null
          currency: string | null
          guest_id: string | null
          id: string
          payment_status: string | null
          property_id: string | null
          room_count: number | null
          special_requests: string | null
          status: string | null
          tenant_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          actual_check_in_date?: string | null
          actual_check_out_date?: string | null
          adult_count?: number | null
          ai_confidence_score?: number | null
          ai_processed?: boolean | null
          booking_reference: string
          cancellation_policy?: string | null
          check_in_date: string
          check_out_date: string
          child_count?: number | null
          created_at?: string | null
          currency?: string | null
          guest_id?: string | null
          id?: string
          payment_status?: string | null
          property_id?: string | null
          room_count?: number | null
          special_requests?: string | null
          status?: string | null
          tenant_id?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          actual_check_in_date?: string | null
          actual_check_out_date?: string | null
          adult_count?: number | null
          ai_confidence_score?: number | null
          ai_processed?: boolean | null
          booking_reference?: string
          cancellation_policy?: string | null
          check_in_date?: string
          check_out_date?: string
          child_count?: number | null
          created_at?: string | null
          currency?: string | null
          guest_id?: string | null
          id?: string
          payment_status?: string | null
          property_id?: string | null
          room_count?: number | null
          special_requests?: string | null
          status?: string | null
          tenant_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_guest_id_guests_id_fk"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_content: {
        Row: {
          content: string | null
          content_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          property_id: string | null
          published_at: string | null
          status: string | null
          tenant_id: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content?: string | null
          content_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          property_id?: string | null
          published_at?: string | null
          status?: string | null
          tenant_id?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          property_id?: string | null
          published_at?: string | null
          status?: string | null
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_content_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_content_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_media: {
        Row: {
          alt_text: string | null
          caption: string | null
          content_id: string | null
          created_at: string | null
          display_order: number | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          metadata: Json | null
          mime_type: string | null
          property_id: string | null
          storage_location: string | null
          tenant_id: string | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          content_id?: string | null
          created_at?: string | null
          display_order?: number | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          property_id?: string | null
          storage_location?: string | null
          tenant_id?: string | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          content_id?: string | null
          created_at?: string | null
          display_order?: number | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          property_id?: string | null
          storage_location?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_media_content_id_cms_content_id_fk"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "cms_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_media_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_media_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_menu_items: {
        Row: {
          allergens: string[] | null
          category_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          dietary_tags: string[] | null
          display_order: number | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          is_available: boolean | null
          name: string
          price: number
          restaurant_id: string | null
          updated_at: string | null
        }
        Insert: {
          allergens?: string[] | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_available?: boolean | null
          name: string
          price: number
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          allergens?: string[] | null
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_available?: boolean | null
          name?: string
          price?: number
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_menu_items_category_id_menu_categories_id_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_menu_items_restaurant_id_restaurants_id_fk"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_rights_requests: {
        Row: {
          account_holder_id: string | null
          assigned_to: string | null
          cooling_off_deadline: string | null
          created_at: string | null
          id: string
          refund_amount: number | null
          refund_deadline: string | null
          request_date: string
          request_description: string
          request_reference: string
          request_type: string
          resolution_date: string | null
          resolution_notes: string | null
          status: string | null
          tenant_id: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_holder_id?: string | null
          assigned_to?: string | null
          cooling_off_deadline?: string | null
          created_at?: string | null
          id?: string
          refund_amount?: number | null
          refund_deadline?: string | null
          request_date: string
          request_description: string
          request_reference: string
          request_type: string
          resolution_date?: string | null
          resolution_notes?: string | null
          status?: string | null
          tenant_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_holder_id?: string | null
          assigned_to?: string | null
          cooling_off_deadline?: string | null
          created_at?: string | null
          id?: string
          refund_amount?: number | null
          refund_deadline?: string | null
          request_date?: string
          request_description?: string
          request_reference?: string
          request_type?: string
          resolution_date?: string | null
          resolution_notes?: string | null
          status?: string | null
          tenant_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumer_rights_requests_account_holder_id_guests_id_fk"
            columns: ["account_holder_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_rights_requests_assigned_to_users_id_fk"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_rights_requests_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_rights_requests_transaction_id_transactions_id_fk"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      cybersecurity_incidents: {
        Row: {
          affected_systems: string[] | null
          availability_loss_minutes: number | null
          bon_reporting_deadline: string | null
          created_at: string | null
          detected_at: string
          financial_loss: number | null
          id: string
          incident_description: string
          incident_reference: string
          incident_type: string
          recovery_completed_at: string | null
          recovery_started_at: string | null
          recovery_time_minutes: number | null
          reported_to_bon_at: string | null
          severity: string
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          affected_systems?: string[] | null
          availability_loss_minutes?: number | null
          bon_reporting_deadline?: string | null
          created_at?: string | null
          detected_at: string
          financial_loss?: number | null
          id?: string
          incident_description: string
          incident_reference: string
          incident_type: string
          recovery_completed_at?: string | null
          recovery_started_at?: string | null
          recovery_time_minutes?: number | null
          reported_to_bon_at?: string | null
          severity: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          affected_systems?: string[] | null
          availability_loss_minutes?: number | null
          bon_reporting_deadline?: string | null
          created_at?: string | null
          detected_at?: string
          financial_loss?: number | null
          id?: string
          incident_description?: string
          incident_reference?: string
          incident_type?: string
          recovery_completed_at?: string | null
          recovery_started_at?: string | null
          recovery_time_minutes?: number | null
          reported_to_bon_at?: string | null
          severity?: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cybersecurity_incidents_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_profiles: {
        Row: {
          accessibility_needs: string[] | null
          average_rating: number | null
          booking_count: number | null
          communication_preferences: Json | null
          created_at: string | null
          dietary_restrictions: string[] | null
          guest_id: string | null
          id: string
          loyalty_points: number | null
          loyalty_tier: string | null
          marketing_consent: boolean | null
          preferred_room_type: string | null
          tenant_id: string | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          accessibility_needs?: string[] | null
          average_rating?: number | null
          booking_count?: number | null
          communication_preferences?: Json | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          guest_id?: string | null
          id?: string
          loyalty_points?: number | null
          loyalty_tier?: string | null
          marketing_consent?: boolean | null
          preferred_room_type?: string | null
          tenant_id?: string | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          accessibility_needs?: string[] | null
          average_rating?: number | null
          booking_count?: number | null
          communication_preferences?: Json | null
          created_at?: string | null
          dietary_restrictions?: string[] | null
          guest_id?: string | null
          id?: string
          loyalty_points?: number | null
          loyalty_tier?: string | null
          marketing_consent?: boolean | null
          preferred_room_type?: string | null
          tenant_id?: string | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_profiles_guest_id_guests_id_fk"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_profiles_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_reviews: {
        Row: {
          booking_id: string | null
          created_at: string | null
          guest_id: string | null
          id: string
          is_public: boolean | null
          property_id: string | null
          rating: number | null
          responded_at: string | null
          responded_by: string | null
          response_text: string | null
          review_category: string | null
          review_text: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          is_public?: boolean | null
          property_id?: string | null
          rating?: number | null
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          review_category?: string | null
          review_text?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          guest_id?: string | null
          id?: string
          is_public?: boolean | null
          property_id?: string | null
          rating?: number | null
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          review_category?: string | null
          review_text?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_reviews_booking_id_bookings_id_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_reviews_guest_id_guests_id_fk"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_reviews_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_reviews_responded_by_users_id_fk"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_reviews_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          first_name: string | null
          id: string
          id_number: string | null
          is_signed_up: boolean | null
          last_name: string | null
          marketing_consent: boolean | null
          nationality: string | null
          passport_number: string | null
          phone: string | null
          postal_code: string | null
          preferences: Json | null
          sign_up_completed_at: string | null
          state: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          first_name?: string | null
          id?: string
          id_number?: string | null
          is_signed_up?: boolean | null
          last_name?: string | null
          marketing_consent?: boolean | null
          nationality?: string | null
          passport_number?: string | null
          phone?: string | null
          postal_code?: string | null
          preferences?: Json | null
          sign_up_completed_at?: string | null
          state?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          first_name?: string | null
          id?: string
          id_number?: string | null
          is_signed_up?: boolean | null
          last_name?: string | null
          marketing_consent?: boolean | null
          nationality?: string | null
          passport_number?: string | null
          phone?: string | null
          postal_code?: string | null
          preferences?: Json | null
          sign_up_completed_at?: string | null
          state?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_restaurant_id_restaurants_id_fk"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      namqr_codes: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          expires_at: string | null
          guest_id: string | null
          id: string
          is_active: boolean | null
          is_signed: boolean | null
          merchant_category_code: string | null
          merchant_id: string | null
          payee_identifier: string | null
          payee_name: string | null
          presentation_mode: string
          property_id: string | null
          qr_image_url: string | null
          qr_payload: string
          qr_reference: string
          qr_type: string
          scan_count: number | null
          signature: string | null
          tenant_id: string | null
          token_vault_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          guest_id?: string | null
          id?: string
          is_active?: boolean | null
          is_signed?: boolean | null
          merchant_category_code?: string | null
          merchant_id?: string | null
          payee_identifier?: string | null
          payee_name?: string | null
          presentation_mode: string
          property_id?: string | null
          qr_image_url?: string | null
          qr_payload: string
          qr_reference: string
          qr_type: string
          scan_count?: number | null
          signature?: string | null
          tenant_id?: string | null
          token_vault_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          guest_id?: string | null
          id?: string
          is_active?: boolean | null
          is_signed?: boolean | null
          merchant_category_code?: string | null
          merchant_id?: string | null
          payee_identifier?: string | null
          payee_name?: string | null
          presentation_mode?: string
          property_id?: string | null
          qr_image_url?: string | null
          qr_payload?: string
          qr_reference?: string
          qr_type?: string
          scan_count?: number | null
          signature?: string | null
          tenant_id?: string | null
          token_vault_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "namqr_codes_guest_id_guests_id_fk"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "namqr_codes_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "namqr_codes_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ob_api_transactions: {
        Row: {
          account_holder_id: string | null
          consent_id: string | null
          created_at: string | null
          endpoint: string
          error_code: string | null
          error_message: string | null
          http_method: string
          http_status_code: number
          id: string
          ip_address: string | null
          request_id: string
          response_time_ms: number | null
          scopes_used: string[] | null
          tpp_participant_id: string | null
        }
        Insert: {
          account_holder_id?: string | null
          consent_id?: string | null
          created_at?: string | null
          endpoint: string
          error_code?: string | null
          error_message?: string | null
          http_method: string
          http_status_code: number
          id?: string
          ip_address?: string | null
          request_id: string
          response_time_ms?: number | null
          scopes_used?: string[] | null
          tpp_participant_id?: string | null
        }
        Update: {
          account_holder_id?: string | null
          consent_id?: string | null
          created_at?: string | null
          endpoint?: string
          error_code?: string | null
          error_message?: string | null
          http_method?: string
          http_status_code?: number
          id?: string
          ip_address?: string | null
          request_id?: string
          response_time_ms?: number | null
          scopes_used?: string[] | null
          tpp_participant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ob_api_transactions_account_holder_id_guests_id_fk"
            columns: ["account_holder_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ob_api_transactions_consent_id_ob_consent_tokens_consent_id_fk"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "ob_consent_tokens"
            referencedColumns: ["consent_id"]
          },
          {
            foreignKeyName: "ob_api_transactions_tpp_participant_id_ob_participants_particip"
            columns: ["tpp_participant_id"]
            isOneToOne: false
            referencedRelation: "ob_participants"
            referencedColumns: ["participant_id"]
          },
        ]
      }
      ob_consent_tokens: {
        Row: {
          access_token: string
          access_token_expires_at: string
          account_holder_id: string | null
          authorization_code: string | null
          authorization_code_expires_at: string | null
          authorization_code_used: boolean | null
          code_challenge: string | null
          code_challenge_method: string | null
          consent_id: string
          created_at: string | null
          dp_participant_id: string | null
          duration_days: number | null
          id: string
          nonce: string | null
          redirect_uri: string
          refresh_token: string | null
          refresh_token_expires_at: string | null
          request_uri: string | null
          revoked_at: string | null
          revoked_by: string | null
          scopes: string[]
          state: string | null
          status: string | null
          tpp_participant_id: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          access_token: string
          access_token_expires_at: string
          account_holder_id?: string | null
          authorization_code?: string | null
          authorization_code_expires_at?: string | null
          authorization_code_used?: boolean | null
          code_challenge?: string | null
          code_challenge_method?: string | null
          consent_id: string
          created_at?: string | null
          dp_participant_id?: string | null
          duration_days?: number | null
          id?: string
          nonce?: string | null
          redirect_uri: string
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          request_uri?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          scopes: string[]
          state?: string | null
          status?: string | null
          tpp_participant_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          access_token?: string
          access_token_expires_at?: string
          account_holder_id?: string | null
          authorization_code?: string | null
          authorization_code_expires_at?: string | null
          authorization_code_used?: boolean | null
          code_challenge?: string | null
          code_challenge_method?: string | null
          consent_id?: string
          created_at?: string | null
          dp_participant_id?: string | null
          duration_days?: number | null
          id?: string
          nonce?: string | null
          redirect_uri?: string
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          request_uri?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: string[]
          state?: string | null
          status?: string | null
          tpp_participant_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ob_consent_tokens_account_holder_id_guests_id_fk"
            columns: ["account_holder_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ob_consent_tokens_tpp_participant_id_ob_participants_participan"
            columns: ["tpp_participant_id"]
            isOneToOne: false
            referencedRelation: "ob_participants"
            referencedColumns: ["participant_id"]
          },
        ]
      }
      ob_participants: {
        Row: {
          certificate_expires_at: string | null
          certificate_serial: string | null
          certificate_valid_from: string | null
          competent_authority_id: string | null
          competent_authority_name: string | null
          contact_email: string
          contact_url: string | null
          created_at: string | null
          developer_portal_url: string | null
          id: string
          metadata: Json | null
          operation_types: string[] | null
          participant_id: string
          participant_name: string
          production_url: string | null
          role: string
          sandbox_url: string | null
          sectors: string[] | null
          services: string[] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          certificate_expires_at?: string | null
          certificate_serial?: string | null
          certificate_valid_from?: string | null
          competent_authority_id?: string | null
          competent_authority_name?: string | null
          contact_email: string
          contact_url?: string | null
          created_at?: string | null
          developer_portal_url?: string | null
          id?: string
          metadata?: Json | null
          operation_types?: string[] | null
          participant_id: string
          participant_name: string
          production_url?: string | null
          role: string
          sandbox_url?: string | null
          sectors?: string[] | null
          services?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          certificate_expires_at?: string | null
          certificate_serial?: string | null
          certificate_valid_from?: string | null
          competent_authority_id?: string | null
          competent_authority_name?: string | null
          contact_email?: string
          contact_url?: string | null
          created_at?: string | null
          developer_portal_url?: string | null
          id?: string
          metadata?: Json | null
          operation_types?: string[] | null
          participant_id?: string
          participant_name?: string
          production_url?: string | null
          role?: string
          sandbox_url?: string | null
          sectors?: string[] | null
          services?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string | null
          expiry_month: number | null
          expiry_year: number | null
          guest_id: string | null
          id: string
          is_default: boolean | null
          last_four: string | null
          metadata: Json | null
          provider: string | null
          tenant_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expiry_month?: number | null
          expiry_year?: number | null
          guest_id?: string | null
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          metadata?: Json | null
          provider?: string | null
          tenant_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expiry_month?: number | null
          expiry_year?: number | null
          guest_id?: string | null
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          metadata?: Json | null
          provider?: string | null
          tenant_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_guest_id_guests_id_fk"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          amenities: string[] | null
          check_in_time: string | null
          check_out_time: string | null
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          has_restaurant_features: boolean | null
          id: string
          images: string[] | null
          is_enterprise: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          owner_id: string | null
          postal_code: string | null
          room_count: number | null
          slug: string
          star_rating: number | null
          state: string | null
          status: string | null
          subscription_tier: string | null
          tenant_id: string | null
          timezone: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          has_restaurant_features?: boolean | null
          id?: string
          images?: string[] | null
          is_enterprise?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          owner_id?: string | null
          postal_code?: string | null
          room_count?: number | null
          slug: string
          star_rating?: number | null
          state?: string | null
          status?: string | null
          subscription_tier?: string | null
          tenant_id?: string | null
          timezone?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          has_restaurant_features?: boolean | null
          id?: string
          images?: string[] | null
          is_enterprise?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          owner_id?: string | null
          postal_code?: string | null
          room_count?: number | null
          slug?: string
          star_rating?: number | null
          state?: string | null
          status?: string | null
          subscription_tier?: string | null
          tenant_id?: string | null
          timezone?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_users_id_fk"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      property_settings: {
        Row: {
          created_at: string | null
          id: string
          property_id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          property_id: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          property_id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_settings_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_orders: {
        Row: {
          booking_id: string | null
          cart_id: string | null
          created_at: string | null
          estimated_ready_at: string | null
          guest_id: string | null
          id: string
          order_number: string
          order_type: string | null
          ordered_at: string | null
          property_id: string | null
          qr_code: string | null
          restaurant_id: string | null
          room_number: string | null
          served_at: string | null
          special_instructions: string | null
          status: string | null
          table_id: string | null
          table_number: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          cart_id?: string | null
          created_at?: string | null
          estimated_ready_at?: string | null
          guest_id?: string | null
          id?: string
          order_number: string
          order_type?: string | null
          ordered_at?: string | null
          property_id?: string | null
          qr_code?: string | null
          restaurant_id?: string | null
          room_number?: string | null
          served_at?: string | null
          special_instructions?: string | null
          status?: string | null
          table_id?: string | null
          table_number?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          cart_id?: string | null
          created_at?: string | null
          estimated_ready_at?: string | null
          guest_id?: string | null
          id?: string
          order_number?: string
          order_type?: string | null
          ordered_at?: string | null
          property_id?: string | null
          qr_code?: string | null
          restaurant_id?: string | null
          room_number?: string | null
          served_at?: string | null
          special_instructions?: string | null
          status?: string | null
          table_id?: string | null
          table_number?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_orders_booking_id_bookings_id_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_orders_guest_id_guests_id_fk"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_orders_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_orders_restaurant_id_restaurants_id_fk"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_orders_table_id_restaurant_tables_id_fk"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_orders_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          capacity: number
          created_at: string | null
          id: string
          is_active: boolean | null
          location: string | null
          property_id: string
          qr_code: string
          qr_code_image_url: string | null
          qr_code_url: string
          restaurant_id: string
          status: string | null
          table_name: string | null
          table_number: string
          updated_at: string | null
        }
        Insert: {
          capacity: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          property_id: string
          qr_code: string
          qr_code_image_url?: string | null
          qr_code_url: string
          restaurant_id: string
          status?: string | null
          table_name?: string | null
          table_number: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          property_id?: string
          qr_code?: string
          qr_code_image_url?: string | null
          qr_code_url?: string
          restaurant_id?: string
          status?: string | null
          table_name?: string | null
          table_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_tables_restaurant_id_restaurants_id_fk"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          capacity: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          cuisine_type: string | null
          description: string | null
          id: string
          images: string[] | null
          name: string
          opening_hours: Json | null
          property_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          name: string
          opening_hours?: Json | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          name?: string
          opening_hours?: Json | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      room_qr_codes: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          property_id: string
          qr_code: string
          qr_code_image_url: string | null
          qr_code_url: string
          room_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          property_id: string
          qr_code: string
          qr_code_image_url?: string | null
          qr_code_url: string
          room_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          property_id?: string
          qr_code?: string
          qr_code_image_url?: string | null
          qr_code_url?: string
          room_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_qr_codes_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_qr_codes_room_id_rooms_id_fk"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_rates: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          is_default: boolean | null
          max_stay_nights: number | null
          min_stay_nights: number | null
          rate_amount: number
          rate_name: string
          room_id: string
          updated_at: string | null
          valid_from: string
          valid_to: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_default?: boolean | null
          max_stay_nights?: number | null
          min_stay_nights?: number | null
          rate_amount: number
          rate_name: string
          room_id: string
          updated_at?: string | null
          valid_from: string
          valid_to: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_default?: boolean | null
          max_stay_nights?: number | null
          min_stay_nights?: number | null
          rate_amount?: number
          rate_name?: string
          room_id?: string
          updated_at?: string | null
          valid_from?: string
          valid_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_rates_room_id_rooms_id_fk"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: string[] | null
          base_rate: number | null
          created_at: string | null
          currency: string | null
          floor: number | null
          id: string
          images: string[] | null
          max_occupancy: number | null
          pet_friendly: boolean | null
          property_id: string | null
          room_number: string
          room_type: string
          smoking_allowed: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amenities?: string[] | null
          base_rate?: number | null
          created_at?: string | null
          currency?: string | null
          floor?: number | null
          id?: string
          images?: string[] | null
          max_occupancy?: number | null
          pet_friendly?: boolean | null
          property_id?: string | null
          room_number: string
          room_type: string
          smoking_allowed?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amenities?: string[] | null
          base_rate?: number | null
          created_at?: string | null
          currency?: string | null
          floor?: number | null
          id?: string
          images?: string[] | null
          max_occupancy?: number | null
          pet_friendly?: boolean | null
          property_id?: string | null
          room_number?: string
          room_type?: string
          smoking_allowed?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      sofia_email_inbox_config: {
        Row: {
          auto_create_guest: boolean | null
          auto_link_conversation: boolean | null
          auto_reply: boolean | null
          check_interval_minutes: number | null
          created_at: string | null
          email_address: string
          folder_name: string | null
          id: string
          imap_host: string
          imap_password: string
          imap_port: number | null
          imap_secure: boolean | null
          imap_username: string
          is_active: boolean | null
          last_checked_at: string | null
          last_email_uid: number | null
          metadata: Json | null
          property_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          auto_create_guest?: boolean | null
          auto_link_conversation?: boolean | null
          auto_reply?: boolean | null
          check_interval_minutes?: number | null
          created_at?: string | null
          email_address: string
          folder_name?: string | null
          id?: string
          imap_host: string
          imap_password: string
          imap_port?: number | null
          imap_secure?: boolean | null
          imap_username: string
          is_active?: boolean | null
          last_checked_at?: string | null
          last_email_uid?: number | null
          metadata?: Json | null
          property_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_create_guest?: boolean | null
          auto_link_conversation?: boolean | null
          auto_reply?: boolean | null
          check_interval_minutes?: number | null
          created_at?: string | null
          email_address?: string
          folder_name?: string | null
          id?: string
          imap_host?: string
          imap_password?: string
          imap_port?: number | null
          imap_secure?: boolean | null
          imap_username?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          last_email_uid?: number | null
          metadata?: Json | null
          property_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sofia_email_inbox_config_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sofia_email_inbox_config_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sofia_email_logs: {
        Row: {
          bounce_reason: string | null
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          html_content: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_id: string | null
          tenant_id: string | null
          text_content: string | null
        }
        Insert: {
          bounce_reason?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          html_content?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          tenant_id?: string | null
          text_content?: string | null
        }
        Update: {
          bounce_reason?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          html_content?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          tenant_id?: string | null
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sofia_email_logs_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sofia_email_threads: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          email_count: number | null
          guest_id: string | null
          id: string
          initial_message_id: string | null
          last_email_at: string | null
          last_replied_at: string | null
          metadata: Json | null
          property_id: string | null
          status: string | null
          subject: string
          tenant_id: string | null
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          email_count?: number | null
          guest_id?: string | null
          id?: string
          initial_message_id?: string | null
          last_email_at?: string | null
          last_replied_at?: string | null
          metadata?: Json | null
          property_id?: string | null
          status?: string | null
          subject: string
          tenant_id?: string | null
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          email_count?: number | null
          guest_id?: string | null
          id?: string
          initial_message_id?: string | null
          last_email_at?: string | null
          last_replied_at?: string | null
          metadata?: Json | null
          property_id?: string | null
          status?: string | null
          subject?: string
          tenant_id?: string | null
          thread_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sofia_email_threads_conversation_id_ai_conversations_id_fk"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sofia_email_threads_guest_id_guests_id_fk"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sofia_email_threads_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sofia_email_threads_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sofia_incoming_emails: {
        Row: {
          attachments: Json | null
          bcc_emails: string[] | null
          cc_emails: string[] | null
          conversation_id: string | null
          created_at: string | null
          error_message: string | null
          fetched_at: string | null
          from_email: string
          from_name: string | null
          guest_id: string | null
          html_body: string | null
          id: string
          in_reply_to: string | null
          message_id: string
          metadata: Json | null
          processed_at: string | null
          property_id: string | null
          received_at: string
          references_header: string | null
          replied_at: string | null
          status: string | null
          subject: string
          tenant_id: string | null
          text_body: string | null
          thread_id: string | null
          to_email: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          fetched_at?: string | null
          from_email: string
          from_name?: string | null
          guest_id?: string | null
          html_body?: string | null
          id?: string
          in_reply_to?: string | null
          message_id: string
          metadata?: Json | null
          processed_at?: string | null
          property_id?: string | null
          received_at: string
          references_header?: string | null
          replied_at?: string | null
          status?: string | null
          subject: string
          tenant_id?: string | null
          text_body?: string | null
          thread_id?: string | null
          to_email: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          bcc_emails?: string[] | null
          cc_emails?: string[] | null
          conversation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          fetched_at?: string | null
          from_email?: string
          from_name?: string | null
          guest_id?: string | null
          html_body?: string | null
          id?: string
          in_reply_to?: string | null
          message_id?: string
          metadata?: Json | null
          processed_at?: string | null
          property_id?: string | null
          received_at?: string
          references_header?: string | null
          replied_at?: string | null
          status?: string | null
          subject?: string
          tenant_id?: string | null
          text_body?: string | null
          thread_id?: string | null
          to_email?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sofia_incoming_emails_conversation_id_ai_conversations_id_fk"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sofia_incoming_emails_guest_id_guests_id_fk"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sofia_incoming_emails_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sofia_incoming_emails_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string | null
          currency: string | null
          department: string | null
          email: string | null
          employee_number: string
          employment_type: string | null
          first_name: string
          hire_date: string
          hourly_rate: number | null
          id: string
          last_name: string
          phone: string | null
          position: string
          property_id: string | null
          salary: number | null
          status: string | null
          tenant_id: string | null
          termination_date: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          department?: string | null
          email?: string | null
          employee_number: string
          employment_type?: string | null
          first_name: string
          hire_date: string
          hourly_rate?: number | null
          id?: string
          last_name: string
          phone?: string | null
          position: string
          property_id?: string | null
          salary?: number | null
          status?: string | null
          tenant_id?: string | null
          termination_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          department?: string | null
          email?: string | null
          employee_number?: string
          employment_type?: string | null
          first_name?: string
          hire_date?: string
          hourly_rate?: number | null
          id?: string
          last_name?: string
          phone?: string | null
          position?: string
          property_id?: string | null
          salary?: number | null
          status?: string | null
          tenant_id?: string | null
          termination_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_shifts: {
        Row: {
          break_duration_minutes: number | null
          checked_in_at: string | null
          checked_out_at: string | null
          created_at: string | null
          end_time: string
          id: string
          notes: string | null
          position: string | null
          property_id: string | null
          shift_date: string
          shift_type: string | null
          staff_id: string | null
          start_time: string
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          break_duration_minutes?: number | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          notes?: string | null
          position?: string | null
          property_id?: string | null
          shift_date: string
          shift_type?: string | null
          staff_id?: string | null
          start_time: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          break_duration_minutes?: number | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          position?: string | null
          property_id?: string | null
          shift_date?: string
          shift_type?: string | null
          staff_id?: string | null
          start_time?: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_shifts_property_id_properties_id_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shifts_staff_id_staff_id_fk"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shifts_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          category: string
          created_at: string | null
          id: string
          ip_address: string | null
          level: string
          message: string
          metadata: Json | null
          session_id: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          level: string
          message: string
          metadata?: Json | null
          session_id?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          level?: string
          message?: string
          metadata?: Json | null
          session_id?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_logs_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_system: boolean | null
          setting_key: string
          setting_value: Json | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          setting_key: string
          setting_value?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          setting_key?: string
          setting_value?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          domain: string | null
          has_restaurant_features: boolean | null
          id: string
          is_enterprise: boolean | null
          monthly_price: number | null
          name: string
          property_type: string | null
          room_count: number | null
          status: string | null
          subdomain: string | null
          subscription_ends_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          has_restaurant_features?: boolean | null
          id?: string
          is_enterprise?: boolean | null
          monthly_price?: number | null
          name: string
          property_type?: string | null
          room_count?: number | null
          status?: string | null
          subdomain?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          has_restaurant_features?: boolean | null
          id?: string
          is_enterprise?: boolean | null
          monthly_price?: number | null
          name?: string
          property_type?: string | null
          room_count?: number | null
          status?: string | null
          subdomain?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          gateway_transaction_id: string | null
          guest_id: string | null
          id: string
          metadata: Json | null
          payment_gateway: string | null
          payment_method_id: string | null
          processed_at: string | null
          status: string | null
          tenant_id: string | null
          transaction_reference: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          gateway_transaction_id?: string | null
          guest_id?: string | null
          id?: string
          metadata?: Json | null
          payment_gateway?: string | null
          payment_method_id?: string | null
          processed_at?: string | null
          status?: string | null
          tenant_id?: string | null
          transaction_reference: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          gateway_transaction_id?: string | null
          guest_id?: string | null
          id?: string
          metadata?: Json | null
          payment_gateway?: string | null
          payment_method_id?: string | null
          processed_at?: string | null
          status?: string | null
          tenant_id?: string | null
          transaction_reference?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_bookings_id_fk"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_guest_id_guests_id_fk"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_method_id_payment_methods_id_fk"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string | null
          balance: number | null
          bank_name: string
          branch: string | null
          created_at: string | null
          currency: string | null
          id: string
          reserved_amount: number | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          account_type?: string | null
          balance?: number | null
          bank_name: string
          branch?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          reserved_amount?: number | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string | null
          balance?: number | null
          bank_name?: string
          branch?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          reserved_amount?: number | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_accounts_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_accounts_psd3: {
        Row: {
          account_name: string
          account_number: string
          balance: number | null
          bank_code: string | null
          bank_name: string
          branch: string | null
          created_at: string | null
          currency: string | null
          deficiency_amount: number | null
          id: string
          last_reconciliation_at: string | null
          outstanding_liabilities: number | null
          reconciliation_status: string | null
          reserve_percentage: number | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          balance?: number | null
          bank_code?: string | null
          bank_name: string
          branch?: string | null
          created_at?: string | null
          currency?: string | null
          deficiency_amount?: number | null
          id?: string
          last_reconciliation_at?: string | null
          outstanding_liabilities?: number | null
          reconciliation_status?: string | null
          reserve_percentage?: number | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          balance?: number | null
          bank_code?: string | null
          bank_name?: string
          branch?: string | null
          created_at?: string | null
          currency?: string | null
          deficiency_amount?: number | null
          id?: string
          last_reconciliation_at?: string | null
          outstanding_liabilities?: number | null
          reconciliation_status?: string | null
          reserve_percentage?: number | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_accounts_psd3_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          session_token: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          session_token: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          email_verification_otp: string | null
          email_verification_otp_expires_at: string | null
          email_verified: boolean | null
          first_name: string | null
          id: string
          is_platform_admin: boolean | null
          last_login_at: string | null
          last_name: string | null
          password_hash: string
          password_reset_token: string | null
          password_reset_token_expires_at: string | null
          phone: string | null
          role: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_verification_otp?: string | null
          email_verification_otp_expires_at?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          is_platform_admin?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          password_hash: string
          password_reset_token?: string | null
          password_reset_token_expires_at?: string | null
          phone?: string | null
          role?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_verification_otp?: string | null
          email_verification_otp_expires_at?: string | null
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          is_platform_admin?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          password_hash?: string
          password_reset_token?: string | null
          password_reset_token_expires_at?: string | null
          phone?: string | null
          role?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_tenants_id_fk"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ai_conversation_channel: "web" | "whatsapp" | "email" | "phone"
      ai_conversation_status: "active" | "completed" | "escalated" | "closed"
      ai_message_sender_type: "user" | "assistant" | "system"
      booking_status:
        | "pending"
        | "confirmed"
        | "checked_in"
        | "checked_out"
        | "cancelled"
        | "no_show"
      employment_type: "full_time" | "part_time" | "contract"
      loyalty_tier: "bronze" | "silver" | "gold" | "platinum"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "served"
        | "cancelled"
      order_type: "dine_in" | "takeout" | "delivery" | "room_service"
      review_category:
        | "stay"
        | "food"
        | "service"
        | "amenities"
        | "value"
        | "other"
      room_status: "available" | "occupied" | "maintenance" | "out_of_order"
      staff_status: "active" | "inactive" | "terminated"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_conversation_channel: ["web", "whatsapp", "email", "phone"],
      ai_conversation_status: ["active", "completed", "escalated", "closed"],
      ai_message_sender_type: ["user", "assistant", "system"],
      booking_status: [
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "no_show",
      ],
      employment_type: ["full_time", "part_time", "contract"],
      loyalty_tier: ["bronze", "silver", "gold", "platinum"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "served",
        "cancelled",
      ],
      order_type: ["dine_in", "takeout", "delivery", "room_service"],
      review_category: [
        "stay",
        "food",
        "service",
        "amenities",
        "value",
        "other",
      ],
      room_status: ["available", "occupied", "maintenance", "out_of_order"],
      staff_status: ["active", "inactive", "terminated"],
    },
  },
} as const
