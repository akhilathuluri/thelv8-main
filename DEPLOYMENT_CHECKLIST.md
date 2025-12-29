# 🚀 Production Deployment Checklist for thelv8

## ⚠️ CRITICAL: Database Functions Missing

### Issue
The order placement is failing because the atomic stock management functions are not created in your Supabase database.

### Fix (REQUIRED BEFORE DEPLOYMENT)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/feitifnjvtipgkinmuhp

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Migration**
   - Copy the entire content of `migrations/008_add_atomic_stock_management.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

4. **Verify Functions Created**
   - Go to "Database" → "Functions"
   - You should see:
     - `decrease_product_stock`
     - `increase_product_stock`
     - `validate_cart_stock`

---

## 🔧 Environment Variables to Update

### 1. Razorpay (CRITICAL - Currently in TEST mode)
```env
# Current (TEST MODE - Won't process real payments!)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_RwXDyNlCJt1O6Y
RAZORPAY_KEY_SECRET=d09vxBe3YvXSoggTRBjq6Tii

# Required for PRODUCTION:
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY
RAZORPAY_KEY_SECRET=your_live_secret_key
```

**How to get LIVE keys:**
1. Go to https://dashboard.razorpay.com/
2. Switch to "Live Mode" (toggle in top-right)
3. Settings → API Keys → Generate Live Keys
4. Copy both Key ID and Key Secret

### 2. Site URL (CRITICAL - Email links won't work!)
```env
# Current (localhost - emails will have broken links!)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Required for PRODUCTION:
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 3. Email Configuration (Resend)
```env
# Current (test emails)
EMAIL_FROM=onboarding@resend.dev
EMAIL_REPLY_TO=onboarding@resend.dev

# Recommended for PRODUCTION:
EMAIL_FROM=orders@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com
```

**Setup:**
1. Go to https://resend.com/domains
2. Add and verify your domain
3. Update the email addresses above

---

## 🔐 Netlify Environment Variables Setup

1. Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables

2. Add ALL these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://feitifnjvtipgkinmuhp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlaXRpZm5qdnRpcGdraW5tdWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDA0MzUsImV4cCI6MjA4MjE3NjQzNX0.ef3JZunC7BZK1evcwOf6zoeXPonsW8yHfT_BLSkS6Sc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlaXRpZm5qdnRpcGdraW5tdWhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjYwMDQzNSwiZXhwIjoyMDgyMTc2NDM1fQ.StkizG8KiH4AQiYWBH1qV2Y-NyewZOFaE_e5BmFu-j4

# UPDATE THESE WITH LIVE VALUES:
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY
RAZORPAY_KEY_SECRET=your_live_secret
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

NEXT_PUBLIC_SITE_NAME=thelv8
NEXT_PUBLIC_ADMIN_EMAIL=admin@thelv8.com

RESEND_API_KEY=re_LP6vzpa9_DbTHSg8qtNovQjtuSXydLXES
EMAIL_FROM=orders@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com
```

---

## 🔗 Razorpay Webhook Configuration

1. Go to https://dashboard.razorpay.com/app/webhooks
2. Click "Add New Webhook"
3. Enter webhook URL: `https://yourdomain.com/api/razorpay/webhook`
4. Select events:
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ payment.refunded
5. Set "Active" to ON
6. Copy the "Webhook Secret"
7. Add to Netlify environment variables:
   ```
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
   ```

---

## 👤 Create Admin User

1. Sign up through your deployed app
2. Go to Supabase Dashboard → Table Editor → `profiles`
3. Find your user row
4. Change `role` from `customer` to `admin`
5. Save

---

## ✅ Pre-Deployment Testing Checklist

### Database Functions (MUST DO FIRST!)
- [ ] Run migration `008_add_atomic_stock_management.sql` in Supabase
- [ ] Verify functions exist in Supabase Dashboard → Database → Functions

### Environment Variables
- [ ] Update Razorpay to LIVE keys
- [ ] Update NEXT_PUBLIC_SITE_URL to production domain
- [ ] Configure custom domain email in Resend
- [ ] Set all environment variables in Netlify

### Integrations
- [ ] Configure Razorpay webhook
- [ ] Verify Supabase RLS policies
- [ ] Check Supabase storage bucket `products` exists
- [ ] Create admin user

### Functionality Testing (After Deployment)
- [ ] Test user signup/login
- [ ] Test adding products to cart
- [ ] Test wishlist functionality
- [ ] Test checkout flow with TEST payment first
- [ ] Test order confirmation email
- [ ] Test admin panel access
- [ ] Switch to LIVE Razorpay and test real payment
- [ ] Test order status updates
- [ ] Test stock management (try ordering same item twice quickly)

---

## 🚨 Common Issues & Solutions

### Issue: "Stock decrease failed"
**Cause:** Database functions not created
**Fix:** Run migration `008_add_atomic_stock_management.sql`

### Issue: Emails not sending
**Cause:** Resend domain not verified
**Fix:** Verify domain in Resend dashboard

### Issue: Payment fails in production
**Cause:** Still using TEST Razorpay keys
**Fix:** Switch to LIVE keys

### Issue: Email links point to localhost
**Cause:** NEXT_PUBLIC_SITE_URL not updated
**Fix:** Set to production domain in Netlify

### Issue: Can't access admin panel
**Cause:** User role not set to admin
**Fix:** Update role in Supabase profiles table

---

## 📊 Post-Deployment Monitoring

1. **Monitor Razorpay Dashboard** for payment issues
2. **Check Supabase Logs** for database errors
3. **Monitor Netlify Functions** for API errors
4. **Test email delivery** regularly
5. **Check stock levels** after orders

---

## 🔒 Security Best Practices

- ✅ Never commit `.env` files to git
- ✅ Use different keys for staging/production
- ✅ Enable Supabase email confirmation
- ✅ Set up proper CORS policies
- ✅ Monitor for suspicious activity
- ✅ Regular database backups (Supabase does this automatically)

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Razorpay Docs:** https://razorpay.com/docs/
- **Resend Docs:** https://resend.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

## ✨ You're Ready to Deploy!

Once you've completed all the items above, your app is production-ready! 🎉

**Deployment Command:**
```bash
git push origin main
```

Netlify will automatically build and deploy your app.
