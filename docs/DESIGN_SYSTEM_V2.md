# PagePass Design System v2.0
**Updated:** 2026-03-14
**Source:** Figma by Jay

---

## Color Palette

### Primary
```css
--primary: #55B2DE;           /* Light blue - buttons, links, accents */
--primary-hover: #4A9FCB;     /* Darker blue for hover states */
```

### Backgrounds
```css
--background: #121212;        /* Main app background */
--background-card: #27272A;   /* Card/surface background */
--background-elevated: #1E1E1E; /* Elevated surfaces */
--background-light: #F1F5F9;  /* Light mode / light sections */
--surface-slate: #24262B;     /* Alternative dark surface */
```

### Text
```css
--foreground: #FFFFFF;        /* Primary text */
--foreground-muted: #D9D9D9;  /* Secondary text */
--text-tertiary: #9F9FA9;     /* Tertiary/placeholder text */
--text-quaternary: #94A3B8;   /* Very subtle text */
```

### Borders
```css
--border: #27272A;            /* Default border */
--border-muted: #334155;      /* Subtle border */
--border-strong: #64748B;     /* Emphasized border */
```

### Status Colors
```css
--success: #32D74B;           /* Green - confirmations */
--warning: #FF9500;           /* Amber - warnings, pending */
--error: #FF3B30;             /* Red - errors (inferred) */
```

### Legacy (REMOVE)
```css
/* OLD - No longer used */
--primary-old: #F96602;
--primary-gradient-start: #F54900;
--primary-gradient-end: #FF6900;
```

---

## Typography

### Font Family
```css
--font-sans: 'Arimo', sans-serif;  /* Primary font */
--font-display: 'Inter', sans-serif; /* Headings/display (optional) */
```

### Font Sizes
```css
--text-xs: 10px;    /* Micro labels */
--text-sm: 12px;    /* Small labels, captions */
--text-base: 14px;  /* Body text (primary) */
--text-md: 16px;    /* Emphasized body */
--text-lg: 18px;    /* Small headings */
--text-xl: 20px;    /* Section headings */
--text-2xl: 24px;   /* Page headings */
--text-3xl: 32px;   /* Large display */
--text-4xl: 48px;   /* Hero text */
```

### Font Weights
```css
--font-normal: 400;   /* Body text */
--font-medium: 500;   /* Emphasized */
--font-semibold: 600; /* Buttons, labels */
--font-bold: 700;     /* Headings */
```

---

## Spacing & Layout

### Border Radius
```css
--radius-sm: 8px;     /* Inputs, small buttons */
--radius-md: 12px;    /* Cards, medium elements */
--radius-lg: 16px;    /* Large cards */
--radius-xl: 24px;    /* Modals, large surfaces */
--radius-2xl: 32px;   /* Hero elements */
--radius-full: 9999px; /* Pills, avatars */
```

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);
```

---

## Component Styles

### Buttons
```css
.btn-primary {
  background: var(--primary);
  color: var(--foreground);
  font-weight: 600;
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  border: none;
}

.btn-secondary {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
  font-weight: 600;
  padding: 12px 24px;
  border-radius: var(--radius-sm);
}
```

### Cards
```css
.card {
  background: var(--background-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  padding: 16px;
}
```

### Inputs
```css
.input {
  background: var(--background-card);
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  font-size: var(--text-base);
}

.input:focus {
  border-color: var(--primary);
  outline: none;
}
```

---

## Migration Checklist

### globals.css
- [ ] Replace `--primary: #F96602` → `--primary: #55B2DE`
- [ ] Remove `--primary-gradient-start` and `--primary-gradient-end`
- [ ] Update `.btn-primary` to solid blue (no gradient)
- [ ] Add new text color variables

### Components to Update
- [ ] TabbedAuthForm - button colors
- [ ] BottomNav - active state color
- [ ] AddBookModal - button colors
- [ ] AppHeader - any accent colors
- [ ] NotificationBell - badge color (keep red? or change?)
- [ ] All buttons throughout app

### New Screens to Build
- [ ] Book Details page (`/books/[id]`)
- [ ] User Profile page (`/profile/[id]`)
- [ ] In Queue view
- [ ] Confirm Handoff (update existing)
- [ ] Marketing landing page

