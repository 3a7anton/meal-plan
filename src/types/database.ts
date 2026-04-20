export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          avatar_url: string | null
          department: string | null
          role: 'employee' | 'admin' | 'food_editor' | 'finance_editor'
          dietary_preferences: string[] | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string | null
          avatar_url?: string | null
          department?: string | null
          role?: 'employee' | 'admin' | 'food_editor' | 'finance_editor'
          dietary_preferences?: string[] | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          avatar_url?: string | null
          department?: string | null
          role?: 'employee' | 'admin' | 'food_editor' | 'finance_editor'
          dietary_preferences?: string[] | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          id: string
          name: string
          description: string | null
          meal_type: 'breakfast' | 'lunch' | 'afternoon_snack' | 'evening_snack' | 'dinner'
          image_url: string | null
          price: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          meal_type: 'breakfast' | 'lunch' | 'afternoon_snack' | 'evening_snack' | 'dinner'
          image_url?: string | null
          price?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          meal_type?: 'breakfast' | 'lunch' | 'afternoon_snack' | 'evening_snack' | 'dinner'
          image_url?: string | null
          price?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      menu_schedules: {
        Row: {
          id: string
          meal_id: string
          scheduled_date: string
          time_slot: string
          capacity: number
          is_available: boolean
          booking_time_limit: number
          price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          meal_id: string
          scheduled_date: string
          time_slot: string
          capacity?: number
          is_available?: boolean
          booking_time_limit?: number
          price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          meal_id?: string
          scheduled_date?: string
          time_slot?: string
          capacity?: number
          is_available?: boolean
          booking_time_limit?: number
          price?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_schedules_meal_id_fkey"
            columns: ["meal_id"]
            referencedRelation: "meals"
            referencedColumns: ["id"]
          }
        ]
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          menu_schedule_id: string
          status: 'pending' | 'confirmed' | 'denied' | 'cancelled'
          notes: string | null
          booked_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          menu_schedule_id: string
          status?: 'pending' | 'confirmed' | 'denied' | 'cancelled'
          notes?: string | null
          booked_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          menu_schedule_id?: string
          status?: 'pending' | 'confirmed' | 'denied' | 'cancelled'
          notes?: string | null
          booked_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_menu_schedule_id_fkey"
            columns: ["menu_schedule_id"]
            referencedRelation: "menu_schedules"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'booking_confirmed' | 'booking_denied' | 'conflict' | 'reminder' | 'cancelled'
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'booking_confirmed' | 'booking_denied' | 'conflict' | 'reminder' | 'cancelled'
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'booking_confirmed' | 'booking_denied' | 'conflict' | 'reminder' | 'cancelled'
          message?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          user_id: string
          month: string
          amount: number
          meal_count: number
          status: 'paid' | 'unpaid' | 'refunded'
          paid_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          amount: number
          meal_count?: number
          status?: 'paid' | 'unpaid' | 'refunded'
          paid_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          amount?: number
          meal_count?: number
          status?: 'paid' | 'unpaid' | 'refunded'
          paid_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      app_settings: {
        Row: {
          id: string
          key: string
          value: string
          description: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          key: string
          value: string
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: string
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_booking_atomic: {
        Args: {
          p_user_id: string
          p_menu_schedule_id: string
          p_notes?: string | null
        }
        Returns: string
      }
    }
    Enums: {
      booking_status: 'pending' | 'confirmed' | 'denied' | 'cancelled'
      meal_type: 'breakfast' | 'lunch'
      notification_type: 'booking_confirmed' | 'booking_denied' | 'conflict' | 'reminder' | 'cancelled'
      user_role: 'employee' | 'admin' | 'food_editor' | 'finance_editor'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use throughout the app
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Meal = Database['public']['Tables']['meals']['Row']
export type MenuSchedule = Database['public']['Tables']['menu_schedules']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type AppSettings = Database['public']['Tables']['app_settings']['Row']

// Extended types with relations
export interface MenuScheduleWithMeal extends MenuSchedule {
  meal: Meal
  booking_count?: number
  remaining_capacity?: number
}

export interface BookingWithDetails extends Booking {
  menu_schedule: MenuScheduleWithMeal
  profile?: Profile
}

export interface BookingStatus {
  pending: 'pending'
  confirmed: 'confirmed'
  denied: 'denied'
  cancelled: 'cancelled'
}

export interface MealType {
  breakfast: 'breakfast'
  lunch: 'lunch'
  afternoon_snack: 'afternoon_snack'
  evening_snack: 'evening_snack'
  dinner: 'dinner'
}

export interface PaymentWithProfile extends Payment {
  profile?: Profile
}
