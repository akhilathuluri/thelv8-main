// @ts-nocheck
import { supabase } from '@/lib/supabase/client';
import { User, Database } from '@/types';

// Type alias for profiles table updates
// Using direct type definition to avoid TypeScript inference issues
type ProfileUpdate = {
  avatar_url?: string | null;
  created_at?: string;
  email?: string;
  full_name?: string | null;
  id?: string;
  phone?: string | null;
  role?: string | null;
  updated_at?: string;
};

export const authService = {
  // Sign up
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  // Sign in
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get user profile
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as User;
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not authenticated');
    
    return this.getUserProfile(user.id);
  },

  // Update profile
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      // @ts-expect-error - Supabase type inference issue with update operations
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },

  // Reset password request
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  },

  // Update password
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  },

  // Check if user is admin
  async isAdmin(userId: string) {
    const profile = await this.getUserProfile(userId);
    return profile.role === 'admin';
  },

  // Get all users (admin only)
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as User[];
  },

  // Update user role (admin only)
  async updateUserRole(userId: string, role: 'customer' | 'admin'): Promise<User> {
    const updates: ProfileUpdate = { role };
    const { data, error } = await supabase
      .from('profiles')
      // @ts-expect-error - Supabase type inference issue with update operations
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },
};
