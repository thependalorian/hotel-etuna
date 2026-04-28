---
name: ui-ux-design-system
description: This skill should be used when designing UI/UX interfaces, creating design systems, or implementing user interfaces. It provides guidance on psychology-driven design principles (Fitt's Law, Hick's Law, Miller's Law, etc.), design tokens, and component patterns.
---

# UI/UX Design System

This skill provides comprehensive guidance on creating beautiful, psychology-driven UI/UX designs based on proven psychological principles and design best practices.

## When to Use This Skill

Use this skill when:
- Designing user interfaces
- Creating design systems
- Building UI components
- Applying psychology principles to design
- Creating design tokens
- Implementing accessibility features

## Psychology Laws (Always Apply)

### Fitt's Law - Target Size & Distance
- Minimum touch target: 44x44px (mobile), 32x32px (desktop)
- Primary CTAs must be larger than secondary actions
- Place related actions close together
- Position key actions at screen edges/corners (infinite edges)

### Hick's Law - Decision Simplification
- Limit navigation items to 5-7 maximum
- Break complex forms into multi-step wizards
- Use progressive disclosure - show only what's needed
- Provide smart defaults to reduce choices

### Miller's Law - Chunking Information
- Group content into chunks of 7±2 items
- Use visual separators between groups
- Organize lists with clear categories
- Break long content into digestible sections

### Jakob's Law - Familiarity Patterns
- Follow platform conventions (iOS/Android/Web standards)
- Place navigation where users expect (top/left)
- Use familiar icons (hamburger, search, home, cart)
- Don't reinvent standard interaction patterns

### Gestalt Principles - Visual Grouping
- **PROXIMITY:** Related items close together
- **SIMILARITY:** Same function = same styling
- **CONTINUITY:** Guide eye flow with alignment
- **CLOSURE:** Users complete incomplete shapes mentally
- **FOCAL POINT:** One dominant element per section

### Doherty Threshold - Response Time
- Target <400ms for all interactions
- Show loading states immediately
- Use skeleton screens, not spinners
- Implement optimistic UI updates

## Psychological Effects to Leverage

### Von Restorff Effect (Isolation)
- Make CTAs visually distinct (color, size, position)
- Use contrast to highlight key information
- One standout element per viewport

### Zeigarnik Effect (Completion Drive)
- Show progress indicators on multi-step flows
- Display incomplete profile/setup prompts
- Use checklists that show completion status

### Goal Gradient Effect (Acceleration)
- Progress bars that show advancement
- "Almost there!" messaging near completion
- Reward proximity to goals visually

### Halo Effect (Beauty = Trust)
- Invest in visual polish - it builds credibility
- High-quality imagery and icons
- Consistent, professional typography

## Design Requirements

### Typography
- NEVER use default system fonts alone
- Establish clear hierarchy: Display → Heading → Body → Caption
- Minimum body text: 16px
- Line height: 1.5-1.7 for readability
- Maximum line width: 65-75 characters

### Colors
- Define semantic colors: success, warning, error, info
- Ensure WCAG AA contrast (4.5:1 text, 3:1 UI)
- Use color purposefully, not decoratively
- Dark mode: Don't just invert - redesign

### Spacing
- Use 4px/8px base unit system
- Consistent spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96
- More whitespace = more premium feel
- Group related elements with tighter spacing

### Components
- All interactive elements need hover/focus/active states
- Buttons: Clear visual hierarchy (primary > secondary > ghost)
- Forms: Labels always visible, helpful error messages
- Cards: Consistent padding, clear visual boundaries

### Animation & Micro-interactions
- Duration: 150-300ms for UI, 300-500ms for emphasis
- Easing: ease-out for entrances, ease-in for exits
- Purpose: Guide attention, confirm actions, show state
- Never animate just for decoration

## Design Tokens

### Color System
```css
:root {
  /* Brand Colors */
  --color-primary-500: #3b82f6;  /* Main brand */
  
  /* Semantic Colors */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #0ea5e9;
  
  /* Surface Colors */
  --surface-background: #ffffff;
  --surface-foreground: #111827;
  --surface-muted: #f9fafb;
}
```

### Typography Scale
```css
:root {
  --text-xs: 0.75rem;      /* 12px - Captions */
  --text-sm: 0.875rem;     /* 14px - Secondary */
  --text-base: 1rem;       /* 16px - Body */
  --text-lg: 1.125rem;     /* 18px - Lead */
  --text-xl: 1.25rem;     /* 20px - H5 */
  --text-2xl: 1.5rem;     /* 24px - H4 */
  --text-3xl: 1.875rem;   /* 30px - H3 */
  --text-4xl: 2.25rem;   /* 36px - H2 */
  --text-5xl: 3rem;       /* 48px - H1 */
}
```

### Spacing System
```css
:root {
  --space-1: 0.25rem;      /* 4px */
  --space-2: 0.5rem;       /* 8px */
  --space-3: 0.75rem;      /* 12px */
  --space-4: 1rem;         /* 16px */
  --space-6: 1.5rem;        /* 24px */
  --space-8: 2rem;         /* 32px */
  --space-12: 3rem;        /* 48px */
  --space-16: 4rem;        /* 64px */
}
```

## Component Patterns

### Button Component (Fitt's Law Optimized)
- Minimum 44px height for mobile
- Clear visual hierarchy (primary > secondary > ghost)
- Loading states with immediate feedback
- Accessible keyboard navigation

### Progress Bar (Zeigarnik & Goal Gradient)
- Show progress with encouraging messages
- Visual milestones (25%, 50%, 75%, 100%)
- Animated for Doherty Threshold (<400ms)
- Accelerate animation as approaching goal

### Card Component (Gestalt Principles)
- Clear boundaries (closure)
- Consistent padding (proximity)
- Related items grouped together
- One focal point per card

## Never Do This

- Generic color schemes (avoid overused purple/blue gradients)
- Walls of text without visual breaks
- Mystery meat navigation (unclear clickable areas)
- Disabled buttons without explanation
- Infinite scroll without position indicator
- Auto-playing media
- Popup modals on page load
- CAPTCHA without alternative

## Always Do This

- Mobile-first responsive design
- Semantic HTML structure
- Accessible color contrast (WCAG AA)
- Keyboard navigation support
- Clear loading and error states
- Meaningful empty states
- Forgiving input formats
- Undo for destructive actions

## Tech Stack Preferences

- Tailwind CSS for styling
- Framer Motion for animations
- Lucide/Phosphor for icons
- CSS variables for theming
- Container queries for components

## Design Checklist

When creating UI components:

- [ ] Follow Fitt's Law (minimum touch targets)
- [ ] Apply Hick's Law (limit choices)
- [ ] Use Miller's Law (chunk information)
- [ ] Follow Jakob's Law (platform conventions)
- [ ] Apply Gestalt principles (visual grouping)
- [ ] Meet Doherty Threshold (<400ms interactions)
- [ ] Ensure WCAG AA contrast
- [ ] Test keyboard navigation
- [ ] Provide loading states
- [ ] Include error states
- [ ] Use consistent spacing (4px/8px system)
- [ ] Establish clear typography hierarchy

## Reference Material

For detailed examples, design tokens, and component code, refer to:
- `../system-design-master/references/SYSTEM_DESIGN_MASTER_GUIDE.md` - Part 8: UI/UX Design section
