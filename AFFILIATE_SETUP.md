# Affiliate System Setup Guide

## ✅ What's Built

The complete affiliate system is now live! Here's what you can do:

### 1. Admin Configuration
- Navigate to **Admin Dashboard** → **Configure Affiliate IDs**
- Or go directly to `/admin/affiliate`
- Add your Bookshop.org shop name
- Add your Amazon Associates tag
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

**Bookshop.org (Recommended):**
1. Visit https://bookshop.org/pages/affiliates
2. Complete the affiliate application
3. Get your Shop Name from your dashboard
4. Higher commissions (10%) + supports indie bookstores

**Amazon Associates:**
1. Visit https://affiliate-program.amazon.com/
2. Complete the associate application
3. Get your Associate Tag (usually ends in `-20`)
4. Wider selection, lower commissions (~4.5%)

### Step 2: Configure in Book Circles

1. Log in as admin
2. Go to Admin Dashboard
3. Click "Configure Affiliate IDs"
4. Enter your affiliate credentials:
   - Bookshop.org: `your-shop-name`
   - Amazon: `yoursite-20`
5. Choose priority (Bookshop recommended)
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
│ [🏪 Bookshop.org]       │
│ [📦 Amazon]             │
└─────────────────────────┘
```

### Button Behavior
- **Primary button** (colored): Your priority service
- **Secondary button** (outlined): Alternative service
- **No ISBN**: Shows search links instead
- **Ads disabled**: Buttons hidden completely

---

## 💰 Revenue Optimization Tips

### 1. Use Bookshop.org as Primary
- 10% commission vs Amazon's ~4.5%
- Users appreciate supporting indie bookstores
- Better brand alignment for book lovers

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
- bookshop_affiliate_id (string)
- amazon_associate_tag (string)
- affiliate_priority ('bookshop' | 'amazon')
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

**Bookshop.org:**
- With ISBN: `https://bookshop.org/a/{shop_name}/{isbn}`
- Without: `https://bookshop.org/search?keywords={query}&affiliate={shop_name}`

**Amazon:**
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
