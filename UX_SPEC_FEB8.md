# PagePass — UX Instructions for OpenClaw

These are user-facing UX/UI instructions from the UX staff. Don't invest in visual polish — a designer will handle that. Get the structure, logic, and flows right.

**Note:** Some items below (purchase flows, soft reminders, onboarding privacy message) may already be built per your Feb 6 synopsis. Skip anything that's already done. If partially done, check against these specs to make sure the details match.

---

## 1. Borrow & Request Flow — What Happens When Someone Taps the Button

There is NO approval step. Requests go through automatically. Circles are the trust boundary — anyone in the circle can borrow.

### Scenario A: Book is available (on the owner's shelf)

Button shown: **"Borrow"**

1. User taps "Borrow"
2. Confirmation dialog appears: "This book is available — [owner name] will be notified." User confirms.
3. Request goes through immediately — no owner approval needed
4. Both parties receive an **in-app notification** AND an **email**: "Time to hand off [Book Title]!"
5. The borrower's handoff card shows: book cover, book title, owner's name, and the **owner's preferred contact method** (phone or email from their profile settings) so the borrower can reach out to arrange pickup
6. The owner's handoff card shows: book cover, book title, borrower's name. No contact info needed — the borrower will reach out.
7. Book status changes to **"In transit"**
8. Owner taps **"I gave it"** / Borrower taps **"I got it"** — either can go first
9. When both confirm → book status changes to **"With [borrower name]"**

### Scenario B: Book is currently borrowed by someone else

Button shown: **"Request"**

1. User taps "Request"
2. Confirmation dialog shows queue position: "You'll be #2 — currently with [name]" User confirms.
3. User is added to the queue
4. Owner gets an **informational notification only**: "[Name] requested [Book Title] — they're #2 in the queue." No action needed.
5. When the current borrower finishes and initiates a pagepass (or returns it to the owner), the handoff flow (Scenario A, steps 4-9) triggers automatically for the next person in queue.

### Scenario C: Book is off shelf

No button shown. Book is not requestable while off shelf. The card shows "Off shelf" label only.

---

## 2. Handoff Flow — Two-Party Confirmation

This is the core flow of the app. There is NO approval step — requests go through automatically. The handoff flow begins when the book is available and the next person in queue is up.

### Triggering the handoff

When a book becomes available for the next person in queue (either it's on the owner's shelf, or the current borrower initiates a pagepass), both parties receive:

- An in-app notification
- An email notification

Content: "Time to hand off [Book Title]!" showing the other person's name. The person who currently HAS the book is the one whose preferred contact method is displayed to the receiver. The receiver needs to reach the holder to arrange pickup — so the holder's contact info shows on the receiver's handoff card. The holder's card just shows the receiver's name (no contact info needed — the receiver will reach out).

### The handoff card

Simple screen with: book cover, book title, the other person's name. The receiver's version also shows the holder's shared contact info. The holder's version just shows the receiver's name. One button:

- For the giver: "I gave it"
- For the receiver: "I got it"

Either party can confirm first. When one confirms, the other gets a nudge: "[Name] confirmed the handoff of [Book Title]. Can you confirm too?" — one tap to confirm.

### Book status progression

Implement a four-state status for books:

- **On shelf** — book is with the owner, not lent out, available to request
- **In transit** — handoff initiated, waiting for both-party confirmation
- **With [name]** — both parties confirmed, book is with this person
- **Off shelf** — owner has taken the book offline. Not requestable.

"In transit" begins when the first person taps their confirmation button. It resolves to "With [name]" when the second person confirms.

### Unconfirmed handoff reminders

- After 48 hours with only one confirmation: send reminder to the other person
- After 96 hours (48 more): send one final reminder
- After that: stop. Book stays "In transit." Owner can follow up personally.
- Do NOT auto-confirm based on one party's confirmation.

### PagePass handoff (borrower-to-borrower)

Identical flow to owner-to-borrower. Same screens, same buttons, same confirmation logic. The only backend difference: the book owner receives an informational notification: "[Name] pagepassed [Book Title] to [Name]."

---

## 3. Contact Preference Sharing

### In profile settings

Add a field: "How should circle members reach you when picking up a book?"

- Options: Phone number, Email, or "Don't share contact info"
- This is optional — users can skip during onboarding and edit anytime in profile settings
- The shared contact info is ONLY displayed to the receiver during an active handoff when this user is the current holder of the book — not visible on profiles or circle member lists

### During onboarding

Include this as a step after account creation: "When someone needs to pick up a book from you, how should they reach you?" with the same options. Allow skip.

---

## 4. "Off Shelf" Status and Owner Control

Owners can take any book offline at any point with one tap. No confirmation modal required.

### Toggle in My Library

- Each book in My Library gets a toggle/button: "Take off shelf" / "Put back on shelf"
- One tap, no confirmation dialog
- Show a brief toast notification after toggling:
  - Off shelf: "[Book Title] is off shelf" with an "Undo" option (disappears after ~5 seconds)
  - Back on shelf: "[Book Title] is back on shelf — [X] people in queue notified"

### Off shelf behavior

- Book stays visible in circle browse views but is more visually muted than borrowed books
- No Request button shown — book is not requestable while off shelf
- Display a subtle "Off shelf" label (no reason shown)

### Queue behavior during off shelf

- People already in the queue STAY in the queue
- They get a notification: "[Book Title] has been taken off shelf by the owner. You'll be notified when it's back."
- When the owner puts the book back on shelf, the queue resumes where it left off and queued users are notified: "[Book Title] is back on shelf! You're #[X] in the queue."

### Recall flow (off shelf while book is borrowed)

If the owner takes a book offline while its status is "With [name]":

- The borrower gets a notification: "[Owner name] needs [Book Title] back when you're ready. Tap here when you're done to arrange the return."
- Use the soft reminder cadence: nudge after 1 week, another after 2 weeks, then stop
- Do NOT set a hard deadline — the owner can follow up personally if urgent
- Once the book is returned (both-party handoff confirmation), status goes to "Off shelf" — NOT "On shelf"

### Circle browse display

Three distinct visual states needed (in order of visual prominence):

1. **Available (on shelf):** Full brightness cover (100% opacity), green badge, Borrow/Request button visible. These should feel vibrant — they're what you want people to notice first.
2. **Borrowed (with [name]):** Cover at ~70% opacity, yellow badge, "With [name]" tag, **Request button still visible** (joining the queue is encouraged). Feels present but slightly receded.
3. **Off shelf:** Cover at ~50% opacity, grey badge, "Off shelf" label with small icon, **no Request button**. Feels paused.

The opacity change creates visual rhythm when scanning — available books jump out without needing to read every badge. The current implementation uses color badges only, which isn't enough differentiation at a glance. Add the cover opacity treatment now.

---

## 5. Circle Browse — Sort, Filter, Pagination

When a user taps into a circle to view its books:

### Default sort order

- Other people's available books first (sorted by most recently added at top)
- Your own available books second (sorted by most recently added at top) — your own books are the least interesting thing in the circle to you
- Borrowed books third (sorted by most recently added at top)
- Off-shelf books last (sorted by most recently added at top)
- Return all groups with an availability/ownership flag so the frontend can sort client-side

### Pagination

- Infinite scroll — load 20 books initially, fetch more on scroll
- No "load more" button, no page numbers

### Quick filter bar (circle-level, NOT the main unified search)

Two rows with clear hierarchy:

**Row 1 — Search field (full width, primary control):**
- Full-width input with placeholder "Search by title or author..."
- Clear button (X) appears inside the field on the right as soon as user starts typing
- Tapping X clears text and resets results

**Row 2 — Filter pills (compact, one horizontal line):**
- **Sort dropdown pill** — compact, shows current value ("Recent," "Title," "Author") with a chevron. Visually greys out when search field has text (sort is irrelevant when searching for a specific book).
- **"Available only" pill** — filled when active, outlined when inactive. No checkbox.
- **"Hide my books" pill** — same style. Per-session toggle (not persisted) — resets to off each time the user opens a circle.
- All pills left-aligned on one row

**Below filter bar:** "Showing X of Y books" as subtle text — only visible when a filter or search is active.

### Sticky filter bar — IMPORTANT

- The entire filter bar (both rows) must be sticky/fixed below the AppHeader when scrolling
- Set sticky `top` value to match AppHeader height — no overlap
- **Add min-height to the book list container** so the filter bar stays pinned even when search narrows to 1-2 results. Currently the page shrinks and the filter bar ends up mid-page. Fix this.
- At 250 books, losing access to filters means losing the ability to find anything

### Owner label on own books

- On the circle browse page, if the book belongs to the logged-in user, do NOT display "Owner: [user's full name]"
- Instead display **"Your book"** in the same position
- Other people's books still show "Owner: [name]" as usual
- Uses the same ownership flag returned by the API

### Remove Delete button from circle browse

- Remove the red Delete button from all book cards in circle browse (both card and list view)
- Book management (delete, off shelf, visibility) belongs in My Library, not in circle browse
- Circle browse is for discovering and borrowing — no destructive actions here
- For the user's own books in circle browse: show the book with its status but no management actions. Just the same card as everyone else sees, minus the Borrow button (since you can't borrow your own book)

### Data requirements

Make sure the API returns these fields with each book for client-side sort/filter:

- Availability status (available / borrowed / off shelf)
- Is this the current user's book (boolean — needed for sort order and hiding own books)
- Current holder name (if borrowed)
- Date added to circle
- Request count (for "most requested" sort)
- Genre/category (if available from Google Books import — don't build a tagging system)

---

## 6. Circle Browse — List View Toggle

Add a card/list view toggle to the circle browse screen.

### Card view (existing, remains default)

- Current layout with larger book covers
- Good for casual browsing of smaller collections

### List view (new)

- Compact rows: small cover thumbnail (~40px), title, author, availability badge, Request/Borrow button (if available)
- Should fit 8-10 books per visible screen
- Same three visual states as card view (available / borrowed / off shelf) with same opacity treatment, adapted for the compact format
- **Density note:** The current list view rows are too tall — each row has full card borders and padding, making it almost the same height as card view. Reduce padding, remove card borders (use subtle divider lines between rows instead), and tighten the row height. The whole point of list view is scanning density. Think Spotify track list, not a stack of cards.
- No Delete button in list view (same rule as card view — no management actions in circle browse)

### Toggle behavior

- Toggle button at the top of the circle view (near the filter bar)
- Remember the user's preference — persist across sessions and circles
- Don't auto-switch based on book count

### "New in this circle" section

- Horizontal scrollable row of 3-5 most recently added books (card format) at the top of the circle view
- Sits above the filter bar and main grid/list
- Always shows in card format regardless of the user's view mode toggle
- **Must include borrow actions** — show the same availability status and Borrow/Request button as the regular browse. A card with no action is a dead end. The whole point of featuring a book is to get someone to grab it.
- If a featured book is borrowed, show the Request button so people can join the queue

### Also apply to My Library

The card/list view toggle should also be available in the My Library tab, using the same toggle and persistence logic.

---

## 7. Goodreads Import — Curation Step

The current import dumps everything from the CSV into the user's library. We need an intermediate selection step between "upload CSV" and "books added to library."

### New flow

1. User uploads CSV (existing functionality)
2. **NEW: Curation screen** — show all books from the CSV with checkboxes, none selected by default
3. User filters and selects which books to add
4. Confirmation: "You're adding [X] books to your library"
5. Selected books are added to library (existing functionality)

### Curation screen requirements

- Display each book as a compact row: small cover thumbnail, title, author, user's Goodreads rating (if available), checkbox
- Live counter at top or bottom updating as selections change: "[X] books ready to share"
- "Select all visible" and "Deselect all" bulk action buttons

### Filter options (applied before selection)

- **Rating filter:** Show books rated 4+ stars (pull from Goodreads CSV `My Rating` field)
- **Date filter:** Show books from last 3 years (pull from `Date Read` field)
- **Type filter:** Fiction only / Non-fiction only (if genre data available)
- **Shelf filter:** "Books I own" (pull from `Bookshelves` or `Exclusive Shelf` field — look for "owned" or similar shelf names)
- Filters stack — applying multiple filters narrows the list further
- Filtered-out books are hidden, not greyed out — keep the list clean

### Mobile guidance

On mobile devices, before the file upload step, show a recommendation to use desktop with a "Doing this on your phone? Here's how" expandable section. Content for the expandable section: CTO to provide screenshots and step-by-step text. Build the expandable UI, content can be added later.

### Data note

Parse these fields from the Goodreads CSV: Title, Author, My Rating, Date Read, Bookshelves/Exclusive Shelf, ISBN/ISBN13 (for matching with Google Books). Not all fields may be present in every export — handle gracefully.

---

## 8. "Yours to Keep" (Gift Books)

Owners can mark books as gifts — borrowing triggers a permanent ownership transfer.

### Data model

- Add a boolean property to books: `yours_to_keep` (default: false)
- This is a property of the book, NOT a status. A book can be "on shelf" AND "yours to keep." Keep this separate from the status field (on shelf / in transit / with [name] / off shelf).

### Toggle in My Library

- Each book gets a "Yours to keep" toggle, settable when adding a book or changeable on existing books
- Toggle can be removed anytime while the book is on shelf
- **Toggle is locked (not editable) while the book status is "With [name]"** — the deal is done, terms can't change mid-loan
- Visual indicator on the book card so owner can distinguish loanable vs gift books at a glance

### Circle browse display

- Books marked "yours to keep" show a small icon (heart or ribbon) and "Yours to keep" label
- This is visible in both card and list view

### Modified request flow for "yours to keep" books

- Confirmation screen text changes to: "[Owner name] is offering this book — yours to keep, no return needed"
- Button text changes to: "I'd love it" (instead of "Request")
- Queue still works first-come-first-served

### Handoff and ownership transfer

- Handoff uses the same two-party confirmation ("I gave it" / "I got it")
- **On both-party confirmation:** automatically transfer ownership:
  - Remove book from original owner's library (complete removal)
  - Add book to new owner's library with full ownership rights
  - Store "Gifted from [original owner name]" in the book's metadata
  - Send notification to original owner: "[Name] received [Book Title]. It's in their library now."
- **No soft reminders** are triggered for "yours to keep" books
- **No recall option** for "yours to keep" books while they're out

### Thank you prompt

- After the receiver confirms "I got it" for a "yours to keep" book, show an optional prompt: "Send [Owner name] a quick thanks?"
- One-tap sends notification: "[Name] says thanks for [Book Title]!"
- If skipped, nothing happens — no persistent prompt

### Edge case — removing toggle while people are queued

- If the owner removes "yours to keep" while the book is on shelf and people are in the queue:
- Queued users get notification: "[Book Title] is no longer marked as yours to keep — it's now a regular loan. You're still #[X] in the queue."
- Users stay in queue (don't auto-remove them)

---

## 9. Purchase Flows (may already be built — verify against these specs)

### "Book unavailable" → buy option

When a user views a book that's currently borrowed and has a queue:

- Show the queue length and the user's potential position: "You'd be #4 — estimated wait: 6-8 weeks"
- Below the "Request" button, add a secondary link: "Want your own copy instead?" that opens the Amazon affiliate URL
- If the queue is short (user would be #1 or #2), still show the buy link but make it less prominent (smaller text, no special framing)
- The Amazon link should open in a new browser tab, not navigate away from PagePass

### Post-pagepass completion screen

When a user confirms a pagepass (handing a book to the next borrower), instead of just a success alert, show a completion screen:

- Book cover image
- "Finished with [Book Title]!" as the heading
- Two secondary action buttons (visually muted — not primary button styling):
  - "Buy your own copy" → Amazon affiliate link (new tab)
  - "Gift this book" → Amazon affiliate link (new tab)
- A dismiss/close option that returns to wherever the user was (My Shelf tab most likely)
- Track which button is tapped (buy-for-self vs gift) as a data tag in your analytics

**Important:** This screen only appears at the moment of pagepass confirmation. Do NOT trigger it as a push notification or show it later.

### Buy vs. gift choice

- Single "Buy on Amazon" button on the completion screen
- On tap, show a simple choice: "For myself" or "As a gift"
- Both open the same Amazon affiliate link in a new tab
- Log the selection for analytics

---

## 10. Onboarding Updates (may already be built — verify)

During the sign-up / onboarding flow, add:

- **Privacy message:** "Your reading data is yours. We never sell individual data to anyone." — visible part of the onboarding experience, not hidden in terms-and-conditions
- **Contact preference:** "When someone needs to pick up a book from you, how should they reach you?" — phone number, email, or skip (see section 2 above)

---

## 11. Soft Reminder Notifications (may already be built — verify)

Implement an automatic reminder system for borrowed books:

- **Trigger:** 3 weeks after a borrow begins, then every 2 weeks after that
- **Message content:** "Still enjoying [Book Title]?" (use the book title, not the borrower's behavior)
- **Delivery:** In-app notification. Push notification if the user has them enabled.
- **Action buttons on the notification:**
  - "Still reading" — dismisses the notification, resets the 2-week timer, logs that the user is still reading
  - "Ready to pagepass" — takes the user to the pagepass flow for that book
- **Confirmation on "Still reading":** Show a brief message: "No rush — enjoy!"
- **No owner-configurable timing.** Reminders are system-generated only. The owner does not set or trigger them.

---

## 12. User Settings — Browse Preferences

Add to profile/settings:

### Default browse view

- Option: Card (default) or List
- Sets the default view for both circle browse and My Library
- The inline card/list toggle on the browse screen still works and overrides the default for that session
- If the user changes the inline toggle, it persists until they leave the screen — it does NOT update the settings default

---

## 13. Profile Avatars — Initials with Color

No photo uploads. Use auto-generated initials avatars (colored circle with the person's initials, like Slack's default).

### Color palette — 10 muted jewel tones

Use these colors (warm and bookish, not corporate):

1. Sage green
2. Dusty rose
3. Slate blue
4. Warm terracotta
5. Muted plum
6. Soft teal
7. Amber
8. Dusty lavender
9. Warm clay
10. Deep seafoam

### Color assignment

- Assign deterministically based on the user's ID (e.g., hash the user ID, mod by 10 to pick a color index)
- Do NOT assign randomly — the same person must always get the same color everywhere
- This also handles the edge case of two people with the same initials in one circle — they'll have different colors automatically

### Two sizes

- **Standard (~32px):** For inline use — circle member lists, notifications, book status tags ("With" indicators), queue lists, "Gifted from" history
- **Large (~48px):** For featured contexts — handoff cards (next to the other person's name), circle member profile views, the user's own avatar in the top bar

Don't go smaller than 32px — initials become unreadable on mobile.

### Where avatars appear

Display the initials avatar everywhere a person's name appears:

- Top bar profile area (already exists as text — add the colored circle)
- Circle member lists
- Handoff cards (next to the other person's name)
- Book status in circle browse — the "With [name]" tag should show the small avatar inline
- Notifications (next to the person who triggered it)
- Queue lists (next to each queued person's name)
- "Gifted from" history on book detail pages
- Owner name on book cards in circle browse

### Text color

- Use white text on all avatar colors — ensure sufficient contrast
- Font weight should be semi-bold for readability at small sizes

---

## Priority Order

Items marked ✅? may already be done — verify and skip if so.

**Immediate fixes (do these first):**
- Remove Delete button from circle browse (both card and list view)
- Make filter bar sticky (search, sort, toggles should not scroll away)
- Add cover opacity treatment (100% available, ~70% borrowed, ~50% off shelf)
- Fix list view density (reduce padding, remove card borders, use divider lines)
- Update sort order (other people's available books first, then own books)
- Implement initials avatars with color palette (replaces current plain text initials)

**Then continue with:**
1. Handoff flow with two-party confirmation and in-transit status
2. Contact preference sharing in profile and onboarding
3. Goodreads import curation step
4. "Off shelf" status, toggle, and recall flow
5. Circle browse — "Hide my books" toggle, borrow actions on "New in this circle" cards
6. List view toggle for circle browse and My Library
7. "Yours to keep" gift book feature (ownership transfer, modified request flow, thank you prompt)
8. User settings — default browse view preference
9. ✅? Post-pagepass completion screen
10. ✅? Soft reminder notifications
11. ✅? Buy option on unavailable books
12. ✅? Onboarding privacy message
13. ✅? Buy vs. gift tracking
