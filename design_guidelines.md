# Stock Market Fantasy Game - Design Guidelines

## Design Approach

**Selected Approach:** Material Design 3 System with Fantasy Gaming Influences

**Justification:** This utility-focused financial education app requires the structure and accessibility of Material Design 3, enhanced with gamification elements inspired by Dream11's engagement patterns and modern fintech apps (Groww, Zerodha) for credibility.

**Key Design Principles:**
- Clarity over decoration: Financial data must be instantly readable
- Progressive disclosure: Complex information revealed contextually
- Gamified progression: Achievement-driven visual feedback
- Trust-building aesthetics: Professional yet approachable

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background Base: 220 15% 8%
- Surface: 220 14% 12%
- Surface Elevated: 220 13% 16%
- Primary Brand: 142 76% 45% (Vibrant green - growth/profit association)
- Primary Variant: 142 70% 38%
- Accent (Profit): 142 76% 45%
- Accent (Loss): 0 72% 51%
- Text Primary: 0 0% 95%
- Text Secondary: 220 10% 70%
- Border/Divider: 220 15% 20%

**Light Mode:**
- Background Base: 0 0% 98%
- Surface: 0 0% 100%
- Surface Elevated: 220 15% 97%
- Primary Brand: 142 65% 42%
- Primary Variant: 142 60% 35%
- Accent (Profit): 142 65% 42%
- Accent (Loss): 0 65% 48%
- Text Primary: 220 15% 15%
- Text Secondary: 220 10% 40%
- Border/Divider: 220 10% 88%

**Semantic Colors:**
- Success/Positive ROI: Use Accent (Profit)
- Loss/Negative ROI: Use Accent (Loss)
- Neutral: 220 10% 50%
- Warning (Contest Closing): 38 92% 50%
- Info: 217 90% 60%

### B. Typography

**Font Family:** Roboto (Material Design 3 standard) via Google Fonts
- Headlines: Roboto Medium/Bold
- Body: Roboto Regular
- Captions/Labels: Roboto Medium (for data emphasis)

**Type Scale:**
- Display (Leaderboard Rank): text-5xl (48px) font-bold
- Headline 1 (Section Titles): text-3xl (30px) font-bold
- Headline 2 (Card Titles): text-xl (20px) font-semibold
- Headline 3 (Subsections): text-lg (18px) font-medium
- Body Large (Primary Text): text-base (16px) font-normal
- Body (Secondary Text): text-sm (14px) font-normal
- Caption (Labels/Metadata): text-xs (12px) font-medium
- Overline (Tags/Categories): text-xs (12px) font-bold uppercase tracking-wider

**Number Display:** Use tabular-nums for consistent alignment of stock prices and ROI percentages

### C. Layout System

**Spacing Primitives:** Use Tailwind units: 2, 3, 4, 6, 8, 12, 16
- Micro spacing (elements within components): p-2, gap-2
- Component internal padding: p-4, p-6
- Section spacing: mb-8, mb-12
- Screen padding: px-4 (mobile), px-6 (tablet+)

**Grid System:**
- Mobile (default): Single column, full-width cards
- Tablet (md:): 2-column grids for contest cards, portfolio holdings
- Desktop (lg:): 3-column layouts for browse/discovery

**Container Max-Widths:**
- Mobile screens: Full width with px-4 padding
- Bottom navigation: Fixed height h-16
- Top app bar: Fixed height h-14

### D. Component Library

**Navigation:**
- Bottom Navigation Bar: 4 items (Market, Portfolio, Contests, Profile) with icons, labels, and active state indicator (primary color fill + label color)
- Top App Bar: Subtle elevation, back button, title, action icons (notifications, settings)

**Cards:**
- Contest Card: Rounded-2xl, subtle shadow, surface color, includes contest name, entry fee (coins), prize pool, participants count, time remaining badge, thumbnail/icon, join button
- Stock Card: Rounded-xl, displays stock symbol, company name, current price, price change (color-coded), selection checkbox or quantity adjuster
- Portfolio Holding Card: Shows stock symbol, quantity held, current value, P/L percentage (with color), compact horizontal layout
- Leaderboard Entry: Horizontal card with rank badge, user avatar, username, portfolio ROI, subtle separator

**Forms & Inputs:**
- Search Bar: Rounded-full, subtle background, search icon prefix, clear button suffix
- Stock Selector: Modal bottom sheet with search, categorized lists, multi-select with budget display
- Coin Balance Display: Prominent chip-style component with coin icon, bold number

**Data Display:**
- ROI Indicator: Large bold percentage with color coding (green positive, red negative), includes arrow icon
- Price Ticker: Compact inline display with symbol, price, change percentage
- Progress Indicators: Linear progress bar for budget usage (primary color fill)
- Stats Grid: 2-column layout for key metrics (contests played, win rate, total ROI)

**Buttons:**
- Primary (Join Contest, Create Portfolio): Filled with primary color, rounded-lg, medium height (h-11)
- Secondary (View Details): Outlined with border-2, primary color border
- Text Button (Cancel): No background, primary color text
- FAB (Add Portfolio): Circular, shadow-lg, primary color, positioned bottom-right (above nav)

**Feedback Elements:**
- Badges: Rounded-full chips for tags (Featured, Closing Soon), small padding px-3 py-1
- Empty States: Centered icon (large, muted), heading, body text, action button
- Loading Skeleton: Animate-pulse on card placeholders during data fetch
- Toasts/Snackbars: Bottom-aligned, rounded corners, brief duration

**Overlays:**
- Modal Bottom Sheets: Rounded top corners (rounded-t-3xl), drag handle, scrollable content
- Dialogs: Centered, max-w-sm, rounded-2xl, include title, content, action buttons

### E. Animations

**Minimal Animation Strategy:**
- Entry fee deduction: Subtle scale-down on coin balance (scale-95 to scale-100, 200ms)
- Card selection: Border color transition (300ms ease)
- Tab switching: Fade transition between views (200ms)
- Pull-to-refresh: Native platform animation
- **Avoid:** Complex scroll-triggered animations, decorative parallax, excessive micro-interactions

---

## Images

**Stock Company Logos:**
- Placement: Within stock cards, portfolio holdings, contest thumbnails
- Size: 40x40px (small contexts), 64x64px (detailed views)
- Style: Square with rounded corners (rounded-lg)
- Fallback: First letter of company symbol in colored circle

**Contest Thumbnails:**
- Placement: Top of contest cards
- Size: Full card width, 120px height
- Style: Abstract gradient or category-based illustrations (Tech, Pharma, Auto sectors)
- Treatment: Subtle overlay gradient to ensure text legibility

**Profile Avatars:**
- Placement: Leaderboard entries, profile section, contest participants
- Size: 32x32px (leaderboard), 80x80px (profile page)
- Style: Circular, default to generated avatar with initials if no photo

**Empty State Illustrations:**
- Placement: When no contests available, empty portfolio, no search results
- Size: 160x160px centered
- Style: Simple line art, primary color accent, Material Design iconography style

**No Large Hero Images:** This is a utility app, not a marketing page. Launch directly into functional content.