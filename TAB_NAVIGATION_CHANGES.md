# Tab Navigation Restructure

## Implementation Complete ✅

### New Structure

**Route Group:** `app/(app)/` - Contains all authenticated pages with shared layout

**Global Elements:**
- **Top Bar** (`AppHeader`): Logo, + Add Book, Bell, Avatar
- **Bottom Nav** (`BottomNav`): 3 tabs with active state

### Three Tabs

#### Tab 1: Circles (`/circles`)
- **Content:** User's circle list (from old dashboard)
- **Features:**
  - Circle cards with name, description, invite code
  - "Create Circle" and "Join Circle" buttons
  - "Books Offered to You" counter/link (when applicable)
  - Admin dashboard link (for admins)
- **Tapping a circle:** Opens `/circles/[id]` detail view

#### Tab 2: My Library (`/library`)
- **Content:** Merged old library + books lent out
- **Features:**
  - All books user owns
  - Categorized by status:
    - 📚 On My Shelf (available)
    - 📖 Lent Out (borrowed by someone)
    - 🚚 In Transit (ready for next person)
  - Import from Goodreads button
  - Visibility toggles per circle
- **Answers:** "Where are all my books?"

#### Tab 3: My Shelf (`/shelf`)
- **Content:** Books user is borrowing + queue positions
- **Features:**
  - 📖 Currently Reading section
    - Shows borrower's books
    - Days borrowed
    - Days remaining / overdue status
  - ⏳ In Queue section
    - Queue position for each book
    - Pass count and reasons
  - Future: Reading history
- **Answers:** "What do I have? What's coming?"

---

## Changes Made

### New Files Created:
1. `app/components/BottomNav.tsx` - Bottom tab navigation
2. `app/(app)/layout.tsx` - Shared authenticated layout
3. `app/(app)/circles/page.tsx` - Circles tab (Tab 1)
4. `app/(app)/library/page.tsx` - My Library tab (Tab 2)
5. `app/(app)/shelf/page.tsx` - My Shelf tab (Tab 3)
6. `app/page.tsx` - Root redirect to /circles
7. `app/dashboard/page.tsx` - Redirect to /circles

### Modified Files:
1. `app/components/AppHeader.tsx`
   - Removed title/subtitle props
   - Added "+ Add Book" button permanently
   - Changed logo link to /circles
   - Changed brand name to "PagePass"

2. `middleware.ts`
   - Added `/shelf` to protected routes

### Removed from Dashboard:
- ✅ "Invite Friends" button (invite link now in circle detail only)
- ✅ "My Library" button (now Tab 2)
- ✅ "Books Offered to You" button (now inline alert on circles tab)
- ✅ "Borrowed Books" button (now Tab 3)
- ✅ "Books Lent Out" button (merged into Tab 2)

---

## Routes

### Old → New Mapping:
- `/` → `/circles`
- `/dashboard` → `/circles` (redirects)
- `/library` → `/library` (same URL, new content)
- `/dashboard/borrowed` → `/shelf`
- `/dashboard/owned` → `/library` (merged)
- `/dashboard/offers` → Still exists, linked from circles tab

### Unchanged:
- `/circles/[id]` - Circle detail view
- `/circles/create` - Create circle
- `/circles/join` - Join circle
- `/admin` - Admin dashboard
- `/notifications` - Notifications page
- `/settings` - Settings page

---

## UI Notes

**Bottom Navigation:**
- Fixed position at bottom
- Active tab highlighted with blue color
- Icons: 🏘️ Circles, 📚 My Library, 📖 My Shelf
- Always visible on all app pages

**Layout:**
- Main content has `pb-20` (padding bottom 20) to prevent overlap with bottom nav
- Top bar is sticky
- Content area has max-width and padding

**No Visual Polish:**
- Basic styling only
- Designer will handle visual refinement later
- Focus on structure and functionality

---

## Testing Checklist

- [ ] Bottom nav shows on all three tabs
- [ ] Active tab highlighted correctly
- [ ] Circles tab shows user's circles
- [ ] Library tab shows all owned books categorized by status
- [ ] Shelf tab shows borrowed books + queue
- [ ] + Add Book button works from all tabs
- [ ] Notification bell works from all tabs
- [ ] Profile menu works from all tabs
- [ ] Old /dashboard URL redirects to /circles
- [ ] Root / redirects to /circles
- [ ] Circle detail pages still work
- [ ] Books offered counter shows when applicable
- [ ] Admin link shows for admins only

---

## Future Enhancements (Not Implemented)

- Search functionality in Circles tab
- Reading history in Shelf tab
- Better empty states
- Pull-to-refresh
- Skeleton loaders
- Animations/transitions
