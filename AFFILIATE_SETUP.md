# Affiliate System Setup Guide

## ✅ What's Built

The complete affiliate system is now live with **Canadian support**! Here's what you can do:

### 1. Admin Configuration
- Navigate to **Admin Dashboard** → **Configure Affiliate IDs**
- Or go directly to `/admin/affiliate`
- Add your Indigo/Chapters affiliate ID (Canada)
- Add your Amazon.ca Associates tag (Canada)
- Add your Amazon.com Associates tag (US/International)
- Choose which service to prioritize

### 2. "Buy This Book" Buttons
Automatically appear on:
- ✅ Library book cards (`/library`)
- ✅ Circle book lists (`/circles/[id]`)
- Shows primary service as main button
- Shows secondary service as outlined button
- Only displays when ads are enabled

### 3. Smart Link Generation
- **With ISBN:** Direct product links
- **Without ISBN:** Search results for title + author
- Tracks all clicks in analytics dashboard
- Opens in new tab with proper security

---

## 🚀 Quick Start

### Step 1: Sign Up for Affiliate Programs

**Indigo/Chapters (Recommended for Canada):**
1. Visit https://www.chapters.indigo.ca/en-ca/affiliate-program/
2. Complete the affiliate application
3. Get your Affiliate ID from your dashboard
4. Supports Canadian bookstores, competitive commissions

**Amazon.ca Associates (Canada):**
1. Visit https://associates.amazon.ca/
2. Complete the associate application
3. Get your .ca Associate Tag (usually ends in `-20`)
4. Wider selection, serves Canadian customers

**Amazon.com Associates (US/International):**
1. Visit https://affiliate-program.amazon.com/
2. Complete the associate application
3. Get your .com Associate Tag (usually ends in `-20`)
4. For US and international customers

### Step 2: Configure in Book Circles

1. Log in as admin
2. Go to Admin Dashboard
3. Click "Configure Affiliate IDs"
4. Enter your affiliate credentials:
   - Indigo: `12345` (your numeric affiliate ID)
   - Amazon.ca: `yoursite-20`
   - Amazon.com: `yoursite-20` (optional, for US users)
5. Choose priority (Indigo recommended for Canadian audience)
6. Save settings

### Step 3: Enable Ads

1. Go to Admin Dashboard
2. Toggle "Ads Enabled" ON
3. "Buy This Book" buttons will now appear

---

## 📊 Tracking & Analytics

### What Gets Tracked
- Every affiliate link click
- Which service (Bookshop vs Amazon)
- Which book was clicked
- Where the click happened (placement)

### View Analytics
- Admin Dashboard → Date range picker
- See "Affiliate Clicks" metric
- Filter by custom date ranges
- Compare Bookshop vs Amazon performance (coming soon)

---

## 🎨 How It Looks

### Library Cards
```
┌─────────────────────────┐
│ 📚 [Book Cover]         │
│ Title                   │
│ by Author               │
│ Available               │
│ ─────────────────       │
│ 📚 Buy this book:       │
│ [🇨🇦 Indigo]            │
│ [📦 Amazon.ca]          │
│ [📦 Amazon.com]         │
└─────────────────────────┘
```

### Button Behavior
- **Primary button** (colored): Your priority service
- **Secondary button** (outlined): Alternative service
- **No ISBN**: Shows search links instead
- **Ads disabled**: Buttons hidden completely

---

## 💰 Revenue Optimization Tips

### 1. Use Indigo as Primary (for Canadian users)
- Competitive commissions
- Users appreciate supporting Canadian bookstores
- Better brand alignment for Canadian book lovers
- Faster shipping for Canadian customers

### 2. Track Performance
- Check affiliate clicks weekly
- See which books get most interest
- Adjust strategy based on data

### 3. Add ISBNs to Books
- Direct product links convert better
- Search links have lower conversion
- Use barcode scanner for easy ISBN capture

### 4. Promote High-Value Books
- Focus on new releases (higher prices)
- Non-fiction often has better margins
- Build collections around themes

---

## 🛠 Technical Details

### Database Schema
```sql
admin_settings table:
- indigo_affiliate_id (string)
- amazon_ca_associate_tag (string)
- amazon_associate_tag (string)
- affiliate_priority ('indigo' | 'amazon-ca' | 'amazon')
- ads_enabled (boolean)
```

### API Endpoints
- `GET /api/affiliate-settings` - Fetch public settings
- `POST /api/admin/affiliate` - Update settings (admin only)

### Components
- `BuyBookButton.tsx` - Main affiliate button component
- Fetches settings on mount
- Generates links based on ISBN/title
- Tracks clicks via PostHog

### Link Formats

**Indigo/Chapters:**
- With ISBN: `https://www.chapters.indigo.ca/en-ca/books/?isbn={isbn}&affiliate={affiliate_id}`
- Without: `https://www.chapters.indigo.ca/en-ca/books/search/?keywords={query}&affiliate={affiliate_id}`

**Amazon.ca:**
- With ISBN: `https://www.amazon.ca/dp/{isbn}?tag={associate_tag}`
- Without: `https://www.amazon.ca/s?k={query}&tag={associate_tag}`

**Amazon.com:**
- With ISBN: `https://www.amazon.com/dp/{isbn}?tag={associate_tag}`
- Without: `https://www.amazon.com/s?k={query}&tag={associate_tag}`

---

## 🔒 Privacy & Compliance

### User Experience
- All links open in new tabs
- Clear labeling ("Buy this book")
- No tracking cookies placed by app
- Affiliate relationship disclosed in settings

### Legal Requirements
- Add affiliate disclosure to Terms of Service
- Example: "Book Circles participates in affiliate programs and may earn commission from purchases made through links on this site."

---

## 📈 Next Steps

### Analytics Enhancements (Coming Soon)
- [ ] Split Bookshop vs Amazon click rates
- [ ] Conversion tracking (if available via APIs)
- [ ] Revenue per user calculations
- [ ] Top performing books report

### Feature Enhancements (Future)
- [ ] Book detail pages with larger buy buttons
- [ ] Curated collections with affiliate links
- [ ] Email notifications with book recommendations
- [ ] Reading list exports with affiliate links

---

## ❓ Troubleshooting

### Buttons Not Showing?
1. Check if ads are enabled (Admin Dashboard)
2. Verify affiliate IDs are saved
3. Make sure books have titles (minimum requirement)
4. Clear browser cache and refresh

### Links Not Working?
1. Verify affiliate IDs are correct format
2. Test affiliate credentials directly on Bookshop/Amazon
3. Check browser console for errors
4. Ensure ISBNs are valid 13-digit format

### Analytics Not Tracking?
1. Verify PostHog is configured
2. Check network tab for API calls
3. Look for `affiliate_link_clicked` events in PostHog
4. Confirm user is logged in

---

## 📞 Support

For issues or questions:
1. Check the admin dashboard for configuration
2. Review analytics for click patterns
3. Test with known good ISBNs first
4. Contact affiliate programs for payout questions

**Last Updated:** 2026-02-06
