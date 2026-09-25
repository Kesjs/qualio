# UI/UX Pro Max — Design Intelligence Rules
## Qualio SaaS — Factory.ai Dark Engineering Aesthetic

### IDENTITY & VISION
You are building **Qualio** — a website QA workspace SaaS. The visual identity is inspired by **Factory.ai**: dark, dense, technical, premium. NOT a generic SaaS with purple gradients and rounded cards.

---

### COLOR SYSTEM
```
Background (deepest):  #050507
Background (surface):  #0a0b0f
Background (elevated): #0f1117
Background (hover):    #141720

Border (subtle):       rgba(255,255,255,0.06)
Border (default):      rgba(255,255,255,0.10)
Border (focus):        rgba(255,255,255,0.18)

Text (primary):        #f0f2f7
Text (secondary):      #8b9ab3
Text (muted):          #4a5568

Accent (amber glow):   #f59e0b   — sparingly for critical severity
Accent (emerald):      #10b981   — passed / healthy states
Accent (rose):         #f43f5e   — critical / error states
Accent (blue):         #3b82f6   — interactive / selected state
Accent (violet dim):   #7c3aed   — AI diagnosis badge
```

### FORBIDDEN COLORS
- No pure white backgrounds
- No purple-to-blue gradients (overused SaaS cliche)
- No neon glow effects
- No bright colorful hero backgrounds
- No gray text on colored backgrounds
- No pure black (#000) or pure white (#fff) without tinting

---

### TYPOGRAPHY
```
Font (display/UI):    'Geist', 'Inter', sans-serif — for headings, nav, labels
Font (mono/data):     'Geist Mono', 'JetBrains Mono', monospace — for metrics, URLs, code, HTTP statuses, scan data
```

**Size scale:**
- Hero title:         4xl–6xl, tracking-tight, font-weight 600–700
- Section headers:    xl–2xl, font-weight 600
- Body:               sm–base, line-height 1.6
- Captions/labels:    xs–sm, tracking-wide, uppercase for status labels

**Rules:**
- Never use Arial, system-ui, or default sans-serif
- Use monospace for: URLs, HTTP codes, console errors, scan metrics, timestamps
- Tracking-wide + uppercase for status chips (CRITICAL, PASSED, MEDIUM)

---

### SPACING & LAYOUT
- Base unit: 4px (0.25rem)
- Use multiples: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px
- Consistent padding inside cards: 16px–24px
- Section padding: 80px–120px vertical
- Max content width: 1200px, centered

### GRID
- Bento grid layout for features: asymmetric, dense, not equal-width
- Use CSS Grid with named areas for complex layouts
- Mobile: single column stack

---

### COMPONENT STANDARDS

#### Cards / Panels
```
background: #0a0b0f
border: 1px solid rgba(255,255,255,0.08)
border-radius: 8px (default), 12px (larger panels)
```
- Never nest cards inside cards
- Use a subtle dot-grid or noise texture background for hero panels

#### Status Chips / Badges
```
Format: [dot] [SEVERITY] [context text]
Colors:
  CRITICAL → rose-500 background at 10% opacity, rose-400 text, rose-500 dot
  HIGH     → amber-500 background at 10% opacity, amber-400 text
  MEDIUM   → blue-500 background at 10% opacity, blue-400 text
  PASSED   → emerald-500 background at 10% opacity, emerald-400 text
```

#### Buttons
```
Primary:   bg-white/10 hover:bg-white/15 border border-white/15 text-white
           px-5 py-2.5 rounded-lg font-medium text-sm transition-all 150ms
CTA:       bg-[#f0f2f7] text-[#050507] hover:bg-white font-semibold
           px-6 py-3 rounded-lg transition-all 150ms
Ghost:     text-[#8b9ab3] hover:text-[#f0f2f7] hover:bg-white/5
```

#### Mock Terminal / Scan UI
- Dark panel, monospace font, syntax highlighting for statuses
- Use ASCII-like progress indicators: check mark, filled circle, empty circle
- Show realistic URLs, error messages, HTTP codes (not "example.com")

---

### ANIMATION & INTERACTIONS
- Duration: 150ms–200ms ease-out for hover states
- Duration: 300ms–400ms ease-out for reveals/entrances
- Scroll animations: subtle translateY(16px) to translateY(0) + opacity
- No bounce/elastic easing
- No slow decorative animations (>600ms)
- No looping spinning icons unless genuinely loading

**Micro-interactions to implement:**
- Button hover: slight brightness increase + subtle border brightening
- Card hover: border brightens from 8% to 14% opacity white
- Status badge pulse: slow ping on critical severity dots
- Scan progress: sequential check mark reveals with 100ms stagger

---

### CONTENT STANDARDS
- No generic placeholder text ("Lorem ipsum", "Feature 1", "Your Website")
- Use realistic QA data: real-looking URLs, HTTP errors, stack traces
- Brand name: Qualio — tagline: "Your website QA workspace"
- Use technical language targeted at developers and tech founders

### REALISTIC DATA EXAMPLES (use these in mocks)
```
URLs:     acme-saas.com, getlaunch.io, startup.dev
Issues:   "Signup button dead click on /pricing", "Contact form 500 error", "Mobile CTA overflow"
Severity: CRITICAL, HIGH, MEDIUM, PASSED
Scans:    42 checks, 3 critical, 5 warnings
Evidence: Screenshot, Network request, Console error, Reproduction steps
```

---

### ANTI-PATTERNS TO AVOID
1. Generic hero with centered text + purple gradient
2. 3-column equal feature cards with icon + title + description
3. Testimonials with stock photo avatars
4. "Built with modern tech" stack logos as a section
5. Excessive padding that makes content feel sparse
6. Generic CTA: "Get Started Today" — use "Run your first scan" or "Open workspace"
7. Fake metrics: "10,000+ happy customers" without context
