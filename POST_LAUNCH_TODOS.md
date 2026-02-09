# Post-Launch TODOs

## Google Books API Key
**Priority:** Medium  
**When:** After launch, if daily book additions > 50-100

**Why:**
- Current setup uses keyless Google Books API requests
- Rate limit: ~100 requests/day (hits quota during 12-book backfill)
- With growth, users will hit this ceiling quickly

**Action:**
1. Register for Google Books API key at: https://console.cloud.google.com/apis/library/books.googleapis.com
2. Free tier: 1,000 requests/day (10x increase)
3. Add key to `.env.local` as `GOOGLE_BOOKS_API_KEY`
4. Update `lib/fetch-book-cover.ts` to include API key in requests:
   ```typescript
   const apiKey = process.env.GOOGLE_BOOKS_API_KEY
   const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${apiKey ? `&key=${apiKey}` : ''}`
   ```

**Monitoring:**
- Watch for API quota errors in logs
- If users report "book cover not found" frequently → likely hitting limit
- Can check quota usage in Google Cloud Console

---

## Other Post-Launch Items
*(Add future items here)*
