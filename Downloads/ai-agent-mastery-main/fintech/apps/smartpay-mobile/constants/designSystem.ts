/**
 * Smartpay Design System
 * Single source of truth for all design tokens
 * 
 * Based on:
 * - Figma: VeGAwsChUvwTBZxAU6H8VQ (Buffr App Design)
 * - buffr-g2p/mobile patterns
 * - Buffr App Design (256 screens)
 * - Buffr Card Design (22 variations)
 * - Smartpay brand (teal accent)
 * 
 * @see ketchup-smartpay/buffr_g2p/docs/BUFFR_G2P_FIGMA_DESIGN_SPEC.json
 * @see .cursor/skills-cursor/smartpay-design/SKILL.md
 */

export const designSystem = {
  name: 'Smartpay Copilot',
  version: '1.0.0',
  figmaFileKey: 'VeGAwsChUvwTBZxAU6H8VQ',
  
  // ═══════════════════════════════════════════════════════════
  // COLORS - Figma + Buffr validated
  // ═══════════════════════════════════════════════════════════
  colors: {
    // PRIMARY SLATE (from Figma #020617 - Buffr base)
    primary: '#020617',        // slate-950 - Buttons, headers, primary text
    primaryDark: '#0F172A',    // slate-900 - Hover states
    primaryLight: '#1E293B',   // slate-800 - Icons, emphasis
    
    // SMARTPAY BRAND (teal for distinction)
    brand: {
      primary: '#005D6E',      // Deep teal - Smartpay primary
      primaryDark: '#004552',  // Darker teal  
      primaryLight: '#B2E5ED', // Light teal
      primaryMuted: '#E6F7F9', // Lightest tint
      50: '#E6F7F9',           // Brand 50 (same as primaryMuted)
    },
    brandDark: '#004552',      // Darker teal (legacy)
    brandLight: '#B2E5ED',     // Light teal (legacy)
    brand50: '#E6F7F9',        // Lightest tint (legacy)
    
    // BACKGROUNDS (Figma #F8FAFC)
    background: '#FFFFFF',     // White - Main background
    surface: '#F8FAFC',        // slate-50 - Cards, alt backgrounds (Figma default)
    surfaceVariant: '#F1F5F9', // slate-100 - Input fields, inactive
    
    // BORDERS
    border: '#E2E8F0',         // slate-200 - Default borders (Figma)
    borderLight: '#F1F5F9',    // slate-100 - Subtle borders
    borderMedium: '#CBD5E1',   // slate-300 - Medium emphasis
    
    // TEXT HIERARCHY (Figma validated contrast)
    text: '#020617',           // slate-950 - Primary (18.3:1 contrast)
    textSecondary: '#64748B',  // slate-500 - Secondary (4.6:1 - WCAG AA)
    textTertiary: '#94A3B8',   // slate-400 - Tertiary (decorative only)
    textPlaceholder: '#CBD5E1',// slate-300 - Placeholder
    
    // NEUTRAL NAMESPACE (for backwards compatibility)
    neutral: {
      text: '#020617',
      textSecondary: '#64748B',
      textTertiary: '#94A3B8',
      background: '#FFFFFF',
      backgroundAlt: '#F8FAFC',
      surface: '#F8FAFC',
      border: '#E2E8F0',
      muted: '#F1F5F9',
    },
    
    // SEMANTIC NAMESPACE
    semantic: {
      success: '#22C55E',
      successLight: '#DCFCE7',
      successDark: '#16A34A',
      error: '#E11D48',
      errorLight: '#FEE2E2',
      errorDark: '#BE123C',
      warning: '#F59E0B',
      warningLight: '#FEF3C7',
      warningDark: '#D97706',
      info: '#2563EB',
      infoLight: '#DBEAFE',
      infoDark: '#1D4ED8',
    },
    
    // FEEDBACK NAMESPACE
    feedback: {
      green: '#22C55E',
      green100: '#DCFCE7',
      red: '#E11D48',
      red100: '#FEE2E2',
      amber: '#F59E0B',
      amber100: '#FEF3C7',
      blue100: '#DBEAFE',
    },
    
    // ACCENT (Buffr amber)
    accent: '#D97706',         // amber-600 - CTAs, highlights (5.2:1 contrast)
    accentDark: '#78350F',     // amber-900 - Warnings
    accentLight: '#FEF3C7',    // amber-100 - Backgrounds
    accentLightest: '#FFFBEB', // amber-50
    
    // FIGMA PRIMARY (Buffr blue - for reference)
    figmaPrimary: '#0029D6',   // Figma Primary CTA color
    
    // SEMANTIC (legacy direct access)
    success: '#22C55E',
    error: '#E11D48',
    warning: '#F59E0B',
    info: '#2563EB',
    
    // FEEDBACK BACKGROUNDS (legacy direct access)
    successBg: '#D1FAE5',
    errorBg: '#FEE2E2',
    warningBg: '#FEF3C7',
    infoBg: '#DBEAFE',
    
    // TRANSACTION-SPECIFIC (Buffr)
    transactionBg: '#F2E9D9',  // Beige - Icon backgrounds
    
    // SERVICE COLORS (3×3 grid)
    services: {
      proofOfLife: '#FFB800',  // Gold
      receive: '#22C55E',      // Green
      wallets: '#2563EB',      // Blue
      cashOut: '#8B5CF6',      // Purple
      vouchers: '#FB923C',     // Orange
      findAgent: '#6B7280',    // Gray
      loans: '#3B82F6',        // Blue
      groups: '#A855F7',       // Violet
      bills: '#E11D48',        // Rose
    },
    
    // COMPLETE SLATE SCALE (full spectrum)
    slate: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      950: '#020617',
    },
    
    // BACKGROUND GRADIENTS
    backgroundGradient: {
      onboarding: {
        colors: ['#005D6E', '#004552'],
        locations: [0, 1],
      },
    },
  },
  
  // ═══════════════════════════════════════════════════════════
  // TYPOGRAPHY - Font system
  // ═══════════════════════════════════════════════════════════
  typography: {
    fontFamily: {
      ios: 'SF Pro',
      android: 'Roboto',
      fallback: 'System',
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    
    fontWeight: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
    
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
    },
    
    // Pre-defined text styles
    textStyles: {
      heroAmount: { fontSize: 40, lineHeight: 50, fontWeight: '700' as const },
      pageTitle: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
      largeTitle: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
      screenTitle: { fontSize: 24, lineHeight: 30, fontWeight: '600' as const },
      sectionHeader: { fontSize: 20, lineHeight: 25, fontWeight: '600' as const },
      subheading: { fontSize: 18, lineHeight: 27, fontWeight: '600' as const },
      bodyLarge: { fontSize: 18, lineHeight: 27, fontWeight: '400' as const },
      body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
      bodySmall: { fontSize: 14, lineHeight: 21, fontWeight: '400' as const },
      bodySecondary: { fontSize: 14, lineHeight: 21, fontWeight: '400' as const },
      bodySm: { fontSize: 14, lineHeight: 21, fontWeight: '400' as const },
      caption: { fontSize: 12, lineHeight: 18, fontWeight: '400' as const },
      button: { fontSize: 16, lineHeight: 16, fontWeight: '600' as const },
      
      // Legacy aliases
      title: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
      titleSm: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
      titleLg: { fontSize: 24, lineHeight: 30, fontWeight: '600' as const },
      h1: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
      h2: { fontSize: 24, lineHeight: 30, fontWeight: '600' as const },
      h3: { fontSize: 20, lineHeight: 25, fontWeight: '600' as const },
      heading: { fontSize: 30, lineHeight: 36, fontWeight: '700' as const },
    },
  },
  
  // ═══════════════════════════════════════════════════════════
  // SPACING - 8px base unit (Fitt's Law)
  // ═══════════════════════════════════════════════════════════
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    '2xl': 40,
    '3xl': 48,
    '4xl': 64,
    
    // Numbered scale (8px grid)
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    
    // Screen-specific
    horizontalPadding: 16,
    sectionSpacing: 32,
    contentBottomPadding: 128,
    
    // Smartpay aliases
    smartpay: {
      horizontalPadding: 16,
    },
  },
  
  // ═══════════════════════════════════════════════════════════
  // BORDER RADIUS - iOS rounded
  // ═══════════════════════════════════════════════════════════
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 28,
    pill: 999,
    full: 9999,
    
    // Card-specific
    physicalCard: 35,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 28,
    pill: 999,
    full: 9999,
  },
  
  // ═══════════════════════════════════════════════════════════
  // SHADOWS - Elevation
  // ═══════════════════════════════════════════════════════════
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 8,
    },
  },
  
  // ═══════════════════════════════════════════════════════════
  // ANIMATION - <400ms (Doherty Threshold)
  // ═══════════════════════════════════════════════════════════
  animations: {
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
    loading: 1500,
    
    buttonPress: { scale: 0.98, duration: 150 },
    slideUp: { duration: 220 },
    spring: {
      damping: 18,
      stiffness: 90,
      mass: 1,
    },
    springBounce: { bounciness: 18, speed: 14 },
  },
  
  // ═══════════════════════════════════════════════════════════
  // COMPONENTS - Specific dimensions
  // ═══════════════════════════════════════════════════════════
  components: {
    // BUTTONS (Figma Primary CTA)
    button: {
      height: {
        lg: 56,
        md: 48,
        sm: 40,
      },
      heightLg: 56,
      heightMd: 48,
      heightSm: 40,
      minTouchTarget: 44,
      paddingX: 24,
      borderRadius: 16,
      borderRadiusPill: 999,
    },
    
    // INPUTS (Figma Input/Large)
    input: {
      height: 56,
      borderRadius: 999,
      paddingX: 16,
      borderWidth: 1,
      borderWidthFocused: 2,
    },
    
    // SEARCH BAR (Figma SearchBar)
    searchBar: {
      height: 48,
      borderRadius: 999,
      placeholder: 'Search anything...',
    },
    
    // CARDS
    balanceCard: {
      height: 120,
      borderRadius: 12,
      padding: 24,
    },
    
    walletCard: {
      width: 164,
      height: 140,
      borderRadius: 16,
      accentBarHeight: 4,
      iconSize: 40,
      iconCircleRadius: 999,
    },
    
    serviceCard: {
      width: 110,
      height: 110,
      borderRadius: 12,
      iconSize: 28,
      labelSize: 13,
    },
    
    serviceTile: {
      iconSize: 28,
      labelSize: 13,
    },
    
    contactChip: {
      size: 40,
      borderRadius: 999,
    },
    
    // NAVIGATION
    header: {
      height: 64,
      avatarSize: 36,
      iconSize: 24,
      notificationBadge: 8,
      searchHeight: 48,
    },
    
    tabBar: {
      height: 72,
      iconSize: 24,
      labelSize: 11,
      activeIndicatorHeight: 3,
    },
    
    // FAB
    fab: {
      size: 56,
      iconSize: 28,
      bottom: 100,
      right: 16,
    },
    
    // MODAL
    modal: {
      handleWidth: 36,
      handleHeight: 5,
      defaultMaxHeight: '60%',
      borderRadius: 24,
      backdropOpacity: 0.25,
    },
    
    bottomSheet: {
      handleWidth: 36,
      handleHeight: 5,
      defaultMaxHeight: '60%',
      borderRadius: 24,
    },
    
    // AVATAR SIZES
    avatar: {
      sm: 32,
      md: 40,
      lg: 56,
      xl: 72,
      xxl: 96,
    },
    
    // QR CODE
    qrCode: {
      minSize: 200,
      borderRadius: 12,
      padding: 16,
    },
  },
  
  // ═══════════════════════════════════════════════════════════
  // LAYOUT - Screen dimensions & grid
  // ═══════════════════════════════════════════════════════════
  layout: {
    servicesGrid: {
      columns: 3,
      gap: 16,
    },
    
    contentWidth: 393, // iPhone 14 Pro reference
  },
  
} as const;

// ═══════════════════════════════════════════════════════════
// TYPE EXPORTS - For TypeScript autocomplete
// ═══════════════════════════════════════════════════════════
export type ColorKey = keyof typeof designSystem.colors;
export type SpacingKey = keyof typeof designSystem.spacing;
export type RadiusKey = keyof typeof designSystem.radius;
export type FontSizeKey = keyof typeof designSystem.typography.fontSize;
