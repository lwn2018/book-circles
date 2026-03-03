# PagePass Design Implementation Plan

## Overview

This document compares existing PagePass components against Jay's Figma designs and outlines what needs to change to align with the new design system.

**Figma Reference Screens:**
- Login (126:2561) - Sign in + Create account tabs
- Avatar Selection (212:2365) - 8 emoji presets
- Get to Know Each Other (171:560) - Onboarding profile
- Home/Circle (14:57) - Circle detail view
- My Library (19:1389) - Book collection
- My Shelf (48:214) - Lending status

---

## 1. Component-by-Component Comparison

### 1.1 TabbedAuthForm (Login Screen)
**File:** `app/auth/signin/TabbedAuthForm.tsx`

**Current State:**
- Standard tab navigation with border-bottom indicator
- Blue-600 primary color throughout
- Basic input styling with gray borders
- Simple "Sign In" / "Get Started" tab labels
- Close button (×) in top-right for non-invite flows

**Figma Design (126:2561):**
- [ ] **Tab styling** - Verify tab indicator styling matches Figma (underline vs. pill)
- [ ] **Typography** - Check heading sizes and font weights
- [ ] **Input fields** - Likely need rounded corners, different border color, placeholder styling
- [ ] **CTA button** - Color, border-radius, shadow, hover states
- [ ] **Spacing** - Padding between elements, form layout
- [ ] **"Forgot password"** positioning

**Required Changes:**
```
Priority: HIGH (first screen users see)
- Update tab styling to match Figma spec
- Adjust input field styling (border-radius, border color, focus state)
- Update button styling (color, padding, font-weight)
- Review spacing/padding throughout
- Add any decorative elements from Figma
```

---

### 1.2 Avatar.tsx + AvatarSection.tsx (Avatar Selection)
**Files:** 
- `app/components/Avatar.tsx` (display component)
- `app/(app)/settings/AvatarSection.tsx` (settings picker)
- `app/(auth)/onboarding/avatar/page.tsx` (onboarding picker)

**Current State:**
- 8 preset emojis: 📚 🌟 🎨 🌈 🚀 🌻 🎭 ⭐
- Pastel background colors: blue-100, yellow-100, purple-100, etc.
- 4-column grid layout
- Ring-4 blue-500 selection indicator with scale-105
- Initials fallback with hash-based color

**Figma Design (212:2365):**
- [ ] **Emoji set** - Confirm same 8 or different emojis?
- [ ] **Background colors** - Match exact colors from Figma
- [ ] **Circle sizing** - Current uses aspect-square, verify sizes
- [ ] **Selection state** - Ring style, color, scale effect
- [ ] **Grid layout** - 4x2 or different arrangement?

**Required Changes:**
```
Priority: MEDIUM
- Verify emoji set matches Figma (may need to update)
- Extract exact background colors from Figma
- Update selection ring style/color if different
- Consider consolidating PRESET_AVATARS into shared constant
  (currently duplicated in Avatar.tsx, AvatarSection.tsx, onboarding/avatar/page.tsx)
```

---

### 1.3 Onboarding Profile (Get to Know Each Other)
**File:** `app/(auth)/onboarding/profile/page.tsx`

**Current State:**
- Heading: "Let's get to know each other"
- Name input field
- Contact method checkboxes (email, phone, text) with expandable inputs
- Checkbox list with gray borders, hover:bg-gray-50
- Skip/Next buttons at bottom

**Figma Design (171:560):**
- [ ] **Visual hierarchy** - Heading styling, subtext
- [ ] **Input styling** - Match other form inputs
- [ ] **Checkbox/selection style** - Custom checkboxes? Card-based selection?
- [ ] **Progress indicator** - ProgressBar component styling
- [ ] **CTA styling** - Primary/secondary button design

**Required Changes:**
```
Priority: MEDIUM
- Update heading/subheading typography
- Style contact preference cards to match Figma
- Possibly replace checkboxes with toggle or card-based selection
- Update button styling (shared with auth forms)
- Review ProgressBar component styling
```

---

### 1.4 Circle Detail Page (Home/Circle)
**File:** `app/(app)/circles/[id]/page.tsx`

**Current State:**
- Circle name as h1 with description below
- InviteLink component for sharing
- 2-column grid on desktop (books | members)
- BooksListWithFilters for book grid
- CollapsibleMembersList for member display

**Figma Design (14:57):**
- [ ] **Header area** - Circle name, description, invite CTA styling
- [ ] **Member avatars** - How are members displayed? Row of avatars?
- [ ] **Book grid** - Card design, spacing, hover states
- [ ] **Filter bar** - Position, styling of filter controls
- [ ] **Empty states** - When no books

**Required Changes:**
```
Priority: HIGH (core feature)
- Review header layout and typography
- Update member display (may need horizontal avatar row)
- Audit BookCard styling in BooksListWithFilters
- Style FilterBar component to match
- Add any additional UI elements from Figma
```

---

### 1.5 My Library Page
**File:** `app/(app)/library/page.tsx` + `LibraryWithViewToggle.tsx`

**Current State:**
- "My Library" heading with book count
- Import from Goodreads link (green button)
- Cards categorized: On Shelf, Off Shelf, Lent Out, In Transit
- View toggle (card/list view)
- Visibility toggles per book

**Figma Design (19:1389):**
- [ ] **Page header** - Title styling, book count badge
- [ ] **Category tabs/sections** - How are status categories displayed?
- [ ] **Book cards** - Cover size, metadata display, action buttons
- [ ] **View toggle UI** - Icon buttons or segmented control?
- [ ] **Add book CTA** - Position and styling

**Required Changes:**
```
Priority: HIGH
- Update page header layout
- Review category section styling
- Audit LibraryBookCard component styling
- Update view toggle component
- Style Goodreads import CTA
```

---

### 1.6 My Shelf Page
**File:** `app/(app)/shelf/page.tsx`

**Current State:**
- "My Shelf" heading with description
- Incoming/Outgoing handoff sections (colored backgrounds)
- Currently Reading section with due dates
- In Queue section with position numbers
- Uses BookCover component throughout

**Figma Design (48:214):**
- [ ] **Page header** - Title styling
- [ ] **Handoff cards** - Background colors, status badges
- [ ] **Book cards** - Due date display, progress indicators?
- [ ] **Queue position** - Badge styling
- [ ] **Empty state** - When not borrowing

**Required Changes:**
```
Priority: MEDIUM
- Review handoff section styling (green/yellow backgrounds)
- Update book card layout for borrowed items
- Style queue position badges
- Review DoneReadingButton styling
```

---

### 1.7 AppHeader.tsx
**File:** `app/components/AppHeader.tsx`

**Current State:**
- White bg with border-b, sticky
- Left: Search icon (or back button on circle pages)
- Center: AddBookButton (absolute positioned)
- Right: NotificationBell + UserMenu

**Figma Design:**
- [ ] **Background** - Color, shadow, border
- [ ] **Search icon** - Style, size
- [ ] **Add button** - Central FAB styling
- [ ] **Notification bell** - Badge styling
- [ ] **User menu** - Avatar display

**Required Changes:**
```
Priority: HIGH
- Update header background/shadow
- Review icon sizing and colors
- Style AddBookButton (may need to become FAB)
- Update NotificationBell badge styling
- Consider mobile vs desktop layouts
```

---

### 1.8 BottomNav.tsx
**File:** `app/components/BottomNav.tsx`

**Current State:**
- Fixed bottom, white bg with top border
- 3 tabs: Circles (🏘️), My Library (📚), My Shelf (📖)
- Active state: blue-600 text + font-semibold
- Emoji icons with text labels below

**Figma Design:**
- [ ] **Tab icons** - Emoji or custom icons?
- [ ] **Active state** - Color, indicator style (underline? filled?)
- [ ] **Spacing** - Tab width, padding
- [ ] **Safe area** - Bottom inset handling

**Required Changes:**
```
Priority: HIGH
- Likely replace emojis with proper icons (Lucide/Heroicons)
- Update active/inactive state styling
- Review safe area insets for mobile
- Consider adding Home tab if in designs
```

---

### 1.9 NotificationBell.tsx
**File:** `app/components/NotificationBell.tsx`

**Current State:**
- SVG bell icon (Heroicons style)
- Red badge with count (max 9+)
- Dropdown panel with notification list
- Fixed/absolute positioning on mobile

**Figma Design:**
- [ ] **Bell icon** - Match exact icon style
- [ ] **Badge** - Color, size, position
- [ ] **Dropdown** - Shadow, border-radius, max-height
- [ ] **Notification items** - Row styling, read/unread states

**Required Changes:**
```
Priority: LOW-MEDIUM
- Update icon to match design system
- Review badge styling
- Update dropdown panel styling
- Style notification list items
```

---

### 1.10 BookCover.tsx + BookCoverPlaceholder.tsx
**Files:** `app/components/BookCover.tsx`, `app/components/BookCoverPlaceholder.tsx`

**Current State:**
- Covers with fallback to styled placeholder
- Placeholder uses jewel tone colors with title/author text
- Opacity varies by status (available: 100%, borrowed: 70%, off_shelf: 50%)
- 2:3 aspect ratio

**Figma Design:**
- [ ] **Cover styling** - Border-radius, shadow
- [ ] **Placeholder design** - Colors, typography, layout
- [ ] **Status indicators** - Opacity or badge/overlay?

**Required Changes:**
```
Priority: MEDIUM
- Review border-radius and shadow on covers
- Update placeholder color palette if different
- Consider adding status badge overlay instead of opacity
```

---

### 1.11 SearchOverlay.tsx
**File:** `app/components/SearchOverlay.tsx`

**Current State:**
- Full-screen overlay with dark backdrop
- Search input at top with close button
- Results grouped: In Your Circles, Your Books, More Books
- BookCard subcomponent with borrow/request actions

**Figma Design:**
- [ ] **Overlay styling** - Backdrop opacity, content width
- [ ] **Search input** - Icon position, styling
- [ ] **Result cards** - Layout, actions
- [ ] **Section headers** - Typography

**Required Changes:**
```
Priority: MEDIUM
- Update overlay backdrop
- Style search input field
- Review result card styling
- Update section header typography
```

---

### 1.12 AddBookModal.tsx
**File:** `app/components/AddBookModal.tsx`

**Current State:**
- Modal overlay with white card
- ISBN input with barcode scan button
- Title autocomplete with dropdown
- Author field, cover preview
- Circle visibility checkboxes

**Figma Design:**
- [ ] **Modal styling** - Size, border-radius, shadow
- [ ] **Scan button** - Style, position
- [ ] **Autocomplete dropdown** - Styling
- [ ] **Form fields** - Consistent with other forms

**Required Changes:**
```
Priority: MEDIUM
- Update modal styling (may become full-screen on mobile)
- Style barcode scan button
- Update autocomplete dropdown styling
- Ensure form fields match design system
```

---

## 2. New Components Needed

Based on typical mobile-first book sharing app patterns, these components may need to be created:

### 2.1 BookCard (Standardized)
**Purpose:** Single reusable book card component with variants
**Variants:**
- Grid view (cover-focused)
- List view (horizontal with details)
- Compact (for search results)
- With actions (borrow, request, etc.)

### 2.2 StatusBadge
**Purpose:** Consistent status indicators
**States:**
- Available (green)
- Borrowed/Lent (orange/yellow)
- In Transit (blue)
- Off Shelf (gray)
- Gift (pink)

### 2.3 MemberAvatar Row
**Purpose:** Horizontal scrollable row of circle member avatars
**Features:**
- +X more indicator
- Clickable to expand full list

### 2.4 TabBar (Reusable)
**Purpose:** Consistent tab navigation pattern
**Usage:** Auth tabs, category filters, view toggles

### 2.5 ActionButton (Floating)
**Purpose:** Consistent FAB/action button
**Features:**
- Position variants (center, bottom-right)
- Size variants
- With/without label

### 2.6 EmptyState
**Purpose:** Consistent empty state pattern
**Elements:**
- Illustration/icon
- Heading
- Description
- CTA button

---

## 3. Design System Foundations

### 3.1 Colors (to extract from Figma)
```
Primary: blue-600 (current) → verify
Secondary: ?
Success: green-600 → verify
Warning: yellow/amber → verify
Error: red-600 → verify
Neutrals: gray scale → verify
```

### 3.2 Typography
```
Headings: font-bold, sizes → verify
Body: text-base → verify
Small: text-sm, text-xs → verify
```

### 3.3 Spacing
```
Page padding: p-4 sm:p-6 → verify
Card padding: p-4, p-6 → verify
Gaps: gap-2, gap-3, gap-4 → verify
```

### 3.4 Border Radius
```
Buttons: rounded-lg → verify
Cards: rounded-lg → verify
Inputs: rounded-lg → verify
Avatars: rounded-full
```

### 3.5 Shadows
```
Cards: shadow, shadow-lg → verify
Modals: shadow-xl, shadow-2xl → verify
```

---

## 4. Implementation Priority

### Phase 1: Core Flow (Week 1)
1. **TabbedAuthForm** - First impression matters
2. **AppHeader** - Visible on every page
3. **BottomNav** - Primary navigation
4. **Avatar** components - Part of onboarding

### Phase 2: Main Features (Week 2)
5. **Circle Detail Page** - Core usage
6. **My Library Page** - Book management
7. **BookCover** - Used everywhere
8. **StatusBadge** (new) - Consistent indicators

### Phase 3: Secondary Features (Week 3)
9. **My Shelf Page** - Lending status
10. **NotificationBell** - Notifications
11. **SearchOverlay** - Search experience
12. **AddBookModal** - Adding books

### Phase 4: Polish (Week 4)
13. **Onboarding screens** - Avatar, Profile, Welcome
14. **Empty states** - All screens
15. **Micro-interactions** - Hover, focus, transitions
16. **Accessibility** - Focus rings, ARIA

---

## 5. Technical Recommendations

### 5.1 Consolidate Shared Constants
Move duplicated definitions to shared files:
- `PRESET_AVATARS` → `lib/constants/avatars.ts`
- Color mappings → `lib/constants/colors.ts`
- Status mappings → `lib/constants/statuses.ts`

### 5.2 Create Design Tokens
Consider Tailwind CSS config updates:
```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'pagepass-primary': '#...', // from Figma
      'pagepass-secondary': '#...',
    }
  }
}
```

### 5.3 Component Library Structure
```
app/components/
  ui/                 # Base UI components
    Button.tsx
    Input.tsx
    Badge.tsx
    Card.tsx
    TabBar.tsx
  book/              # Book-related
    BookCard.tsx
    BookCover.tsx
    StatusBadge.tsx
  layout/            # Layout components
    AppHeader.tsx
    BottomNav.tsx
    PageContainer.tsx
```

---

## 6. Next Steps

1. **Design Review Session** - Walk through Figma with Jay to confirm gaps
2. **Extract Design Tokens** - Colors, typography, spacing from Figma
3. **Create Shared UI Components** - Button, Input, Badge, Card
4. **Update High-Priority Components** - Auth, Header, Nav
5. **Iterate on Feature Screens** - Circle, Library, Shelf

---

*Document created: Component inventory vs. Figma designs*
*Last updated: [Current Date]*
