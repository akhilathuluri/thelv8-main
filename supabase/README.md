# Supabase Database Setup Guide

## Prerequisites
1. Create a Supabase account at https://supabase.com
2. Create a new project

## Step 1: Get Your Credentials
1. Go to Project Settings > API
2. Copy the following values to your `.env.local` file:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 2: Run the Schema
1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `schema.sql`
3. Paste and run it in the SQL Editor
4. This will create all tables, policies, triggers, and seed data

## Step 3: Verify Setup
Check that the following tables were created:
- ✅ profiles
- ✅ categories
- ✅ products
- ✅ addresses
- ✅ orders
- ✅ cart
- ✅ wishlist

## Step 4: Create First Admin User
1. Sign up through your app
2. Go to Supabase Dashboard > Authentication > Users
3. Find your user and copy the UUID
4. Go to SQL Editor and run:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'YOUR-USER-UUID';
```

## Database Structure

### Tables Overview

**profiles** - User information (extends auth.users)
- Role-based access (customer/admin)
- Automatically created on signup

**categories** - Product categories
- Hierarchical (parent_id for subcategories)
- Slug-based URLs

**products** - Product catalog
- Multiple images support
- Color variants with hex codes
- Size options
- Stock management
- SKU tracking
- Featured/Published flags

**addresses** - User shipping addresses (Indian format)
- 6-digit pincode validation
- Default address flag
- City, State, Pincode fields

**orders** - Order management
- Order number generation
- Status tracking
- Payment integration (Razorpay/COD)
- Shipping address stored as JSONB
- Order items stored as JSONB

**cart** - Shopping cart
- Per-user persistent cart
- Color and size selection
- Quantity management

**wishlist** - User wishlist
- One-click add/remove

### Row Level Security (RLS)

All tables have RLS enabled:
- **Public**: Can view published products and categories
- **Authenticated Users**: Can manage their own cart, wishlist, addresses, and orders
- **Admins**: Full access to products, categories, and all orders

### Indexes

Optimized for:
- Product search (full-text search enabled)
- Category filtering
- Order history queries
- Cart and wishlist lookups

### Storage

**products** bucket for product images:
- Public read access
- Admin-only upload/modify/delete

## Next Steps

After setup:
1. Test authentication by signing up
2. Promote your user to admin
3. Use the admin panel to add products
4. Test the shopping flow

## Troubleshooting

**Authentication Issues:**
- Check email confirmation settings in Supabase Dashboard > Authentication > Settings
- Disable email confirmation for development

**RLS Errors:**
- Make sure your user is authenticated
- Check admin role is set correctly for admin features

**Storage Errors:**
- Verify storage bucket "products" exists
- Check storage policies are applied
