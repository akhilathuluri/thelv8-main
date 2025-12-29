// @ts-nocheck
import { supabase } from '@/lib/supabase/client';
import { CartItem } from '@/types';

// Local cart row type
type CartRow = {
  created_at: string;
  id: string;
  product_id: string;
  quantity: number | null;
  selected_color: string;
  selected_size: string;
  updated_at: string;
  user_id: string;
};

// Cart insert type
type CartInsert = {
  created_at?: string;
  id?: string;
  product_id: string;
  quantity?: number | null;
  selected_color: string;
  selected_size: string;
  updated_at?: string;
  user_id: string;
};

export const cartService = {
  // Get user's cart
  async getCart(userId: string) {
    const { data, error } = await supabase
      .from('cart')
      .select('*, product:products(*, category:categories(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as unknown as CartItem[];
  },

  // Add item to cart
  async addToCart(userId: string, productId: string, color: string, size: string, quantity = 1) {
    try {
      // Use default values if color/size are empty
      const selectedColor = color || 'default';
      const selectedSize = size || 'default';
      
      console.log('Cart service - adding:', { userId, productId, selectedColor, selectedSize, quantity });
      
      // Check if item already exists
      const { data: existing, error: existingError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('selected_color', selectedColor)
        .eq('selected_size', selectedSize)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine
        console.error('Error checking existing cart item:', existingError);
        throw new Error(existingError.message || 'Failed to check cart');
      }

      if (existing) {
        // Update quantity
        const existingData = existing as CartRow;
        const { data, error } = await supabase
          .from('cart')
          .update({ quantity: (existingData.quantity || 0) + quantity })
          .eq('id', existingData.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating cart quantity:', error);
          throw new Error(error.message || 'Failed to update cart');
        }
        return data;
      } else {
        // Insert new item
        const insertData: CartInsert = {
          user_id: userId,
          product_id: productId,
          selected_color: selectedColor,
          selected_size: selectedSize,
          quantity,
        };
        
        console.log('Inserting cart item:', insertData);
        
        const { data, error } = await supabase
          .from('cart')
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error('Error inserting cart item:', error);
          throw new Error(error.message || 'Failed to add to cart. Please check if you are signed in.');
        }
        return data;
      }
    } catch (err: any) {
      console.error('Cart service error:', err);
      throw err;
    }
  },

  // Update cart item quantity
  async updateQuantity(cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeFromCart(cartItemId);
    }

    const { data, error } = await supabase
      .from('cart')
      .update({ quantity })
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove item from cart
  async removeFromCart(cartItemId: string) {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', cartItemId);

    if (error) throw error;
  },

  // Clear entire cart
  async clearCart(userId: string) {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Get cart count
  async getCartCount(userId: string) {
    const { count, error } = await supabase
      .from('cart')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  },
};
