# 🛒 Stock Issue Resolution Guide

## ✅ Good News!
Your backend is working **perfectly**! All stock management functions are preventing overselling correctly.

## 🎯 The Issue
A user has "LOCAL BUM PINK" size M in their cart, but size M has **0 stock available**.

### What's Happening:
1. ✅ Validation detects the issue: `valid: false`
2. ✅ Stock decrease fails: `Insufficient stock for size M. Available: 0`
3. ✅ Order is **NOT created** (preventing overselling)
4. ❌ Error message to user could be clearer

## 🔧 Immediate Fix

### Option 1: Remove the Specific Cart Item (Recommended)
Run this in Supabase SQL Editor:

```sql
-- Remove the out-of-stock item
DELETE FROM cart 
WHERE product_id = 'd152da78-340f-41a1-8329-f3be8c66f57d' 
AND selected_size = 'M';
```

### Option 2: Clean Up ALL Out-of-Stock Cart Items
Run this in Supabase SQL Editor:

```sql
-- Remove all cart items with insufficient stock
DELETE FROM cart
WHERE id IN (
    SELECT c.id
    FROM cart c
    JOIN products p ON c.product_id = p.id
    WHERE 
        -- Size-specific stock check
        (c.selected_size IS NOT NULL AND c.selected_size != '' 
         AND COALESCE((p.stock_by_size->>c.selected_size)::INTEGER, 0) < c.quantity)
        OR
        -- Total stock check
        ((c.selected_size IS NULL OR c.selected_size = '') 
         AND p.stock < c.quantity)
);
```

### Option 3: Update Quantities to Match Available Stock
Run this in Supabase SQL Editor:

```sql
-- Adjust cart quantities to available stock
UPDATE cart c
SET quantity = CASE 
    WHEN c.selected_size IS NOT NULL AND c.selected_size != '' THEN
        GREATEST(1, COALESCE((p.stock_by_size->>c.selected_size)::INTEGER, 0))
    ELSE
        GREATEST(1, p.stock)
END
FROM products p
WHERE c.product_id = p.id
AND (
    (c.selected_size IS NOT NULL AND c.selected_size != '' 
     AND COALESCE((p.stock_by_size->>c.selected_size)::INTEGER, 0) < c.quantity)
    OR
    ((c.selected_size IS NULL OR c.selected_size = '') 
     AND p.stock < c.quantity)
);

-- Then delete items with 0 stock
DELETE FROM cart c
USING products p
WHERE c.product_id = p.id
AND (
    (c.selected_size IS NOT NULL AND c.selected_size != '' 
     AND COALESCE((p.stock_by_size->>c.selected_size)::INTEGER, 0) = 0)
    OR
    ((c.selected_size IS NULL OR c.selected_size = '') 
     AND p.stock = 0)
);
```

## 📊 Check Current Status

Run this to see all cart items with stock issues:

```sql
SELECT 
    c.id as cart_item_id,
    p.name as product_name,
    c.selected_size,
    c.quantity as requested,
    CASE 
        WHEN c.selected_size IS NOT NULL AND c.selected_size != '' THEN
            COALESCE((p.stock_by_size->>c.selected_size)::INTEGER, 0)
        ELSE
            p.stock
    END as available,
    CASE 
        WHEN c.selected_size IS NOT NULL AND c.selected_size != '' THEN
            CASE 
                WHEN COALESCE((p.stock_by_size->>c.selected_size)::INTEGER, 0) < c.quantity 
                THEN '❌ INSUFFICIENT'
                ELSE '✅ OK'
            END
        ELSE
            CASE 
                WHEN p.stock < c.quantity 
                THEN '❌ INSUFFICIENT'
                ELSE '✅ OK'
            END
    END as status
FROM cart c
JOIN products p ON c.product_id = p.id;
```

## 🚀 Long-Term Solutions

### 1. Frontend Stock Validation (Recommended)
Add real-time stock checking in the cart UI:
- Show "Out of Stock" badge on cart items
- Disable checkout button if any items are out of stock
- Auto-refresh stock when cart page loads

### 2. Stock Alerts
Add notifications when stock is low:
- Show "Only X left" messages
- Warn users before adding to cart if stock is low

### 3. Automatic Cart Cleanup
Add a scheduled job to clean up old cart items with no stock:
```sql
-- Run this periodically (e.g., daily)
DELETE FROM cart
WHERE created_at < NOW() - INTERVAL '7 days'
OR id IN (
    SELECT c.id
    FROM cart c
    LEFT JOIN products p ON c.product_id = p.id
    WHERE p.id IS NULL  -- Product deleted
    OR (
        c.selected_size IS NOT NULL 
        AND COALESCE((p.stock_by_size->>c.selected_size)::INTEGER, 0) = 0
    )
);
```

## ✨ What's Working Correctly

Your system is **preventing overselling** which is the most critical feature! ✅

- ✅ Stock validation before order creation
- ✅ Atomic stock decrease (prevents race conditions)
- ✅ Automatic rollback if order fails
- ✅ Size-specific stock tracking
- ✅ Database-level locking (prevents concurrent issues)

## 📝 User Instructions

Tell users to:
1. Go to their cart
2. Remove "LOCAL BUM PINK" size M
3. Add size L or XL instead (they have stock)
4. Or refresh the page (after you run the cleanup SQL)

## 🎉 Summary

**The backend is working perfectly!** The issue is just that a user has an out-of-stock item in their cart. After running one of the cleanup options above, everything will work smoothly.

The improved error messages in the checkout page will now show:
- Which product is out of stock
- Which size is unavailable
- How much stock is available

This gives users clear information to fix their cart! 🛒
