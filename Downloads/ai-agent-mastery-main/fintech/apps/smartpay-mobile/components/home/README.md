# Smartpay Home Components

Implementation of Home screen components following exact Figma specifications from the design skill.

## Components Implemented

### 1. BalanceCard.tsx ✅
**Figma Specs:**
- Height: 120px
- Border Radius: 12px
- Padding: 24px
- Shadow: md
- Background: White

**Features:**
- Total balance display with N$ formatting
- Eye toggle for privacy (show/hide balance)
- Wallet name display
- Accessibility labels

**Props:**
```typescript
interface BalanceCardProps {
  balance: number;
  balanceVisible: boolean;
  onToggleVisibility: () => void;
  walletName: string;
}
```

---

### 2. WalletCard.tsx ✅
**Figma Specs:**
- Size: 164×140px
- Border Radius: 16px
- Accent bar: 4px height at top
- Icon: 40px circular (999px radius)
- Name: 14px weight 600
- Balance: 18px weight 700
- Progress bar: 4px height (optional)
- Shadow: sm

**Features:**
- Accent bar with wallet color
- Circular icon with 15% opacity background
- Balance with N$ formatting
- Optional progress bar for goal wallets

**Props:**
```typescript
interface WalletCardComponentProps {
  wallet: Wallet;
  index: number;
  onPress: () => void;
}
```

---

### 3. WalletCarousel.tsx ✅
**Figma Specs:**
- Horizontal FlatList
- Card width: 164px + 16px gap
- Add Wallet card at end
- Snap to alignment

**Features:**
- Horizontal scrollable wallet cards
- Snap to card alignment
- Add Wallet card with dashed border
- 16px gap between cards

**Props:**
```typescript
interface WalletCarouselProps {
  wallets: Wallet[];
  onWalletPress: (wallet: Wallet) => void;
  onAddWallet: () => void;
}
```

---

### 4. ServiceTile.tsx ✅
**Figma Specs:**
- Size: 110×110px (square)
- Border Radius: 12px
- Icon: 28px
- Label: 13px weight 500, max 2 lines
- Background: Service color + 15% opacity
- Pressed state: opacity 0.7

**Features:**
- Square tile with service color background
- Icon with service color
- Center-aligned label (max 2 lines)
- Touch feedback with opacity

**Props:**
```typescript
interface ServiceTileProps {
  service: Service;
  width: number;
  onPress: () => void;
}
```

**Service Type:**
```typescript
interface Service {
  id: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  route: string;
}
```

---

### 5. ServicesGrid.tsx ✅
**Figma Specs:**
- 3×3 grid layout (9 tiles)
- Tile calculation: (screenWidth - padding - gaps) / 3
- Gap: 16px between tiles
- Services from designSystem.colors.services

**Features:**
- Dynamic tile width calculation
- Section header with "Services" title
- Uses ServiceTile component
- 16px gap between all tiles

**Props:**
```typescript
interface ServicesGridProps {
  services: Service[];
  onServicePress: (service: Service) => void;
}
```

**Example Services Array:**
```typescript
const services = [
  { id: 'proof-of-life', label: 'Proof of Life', icon: 'shield-checkmark-outline', color: DS.colors.services.proofOfLife, route: '/proof-of-life/intro' },
  { id: 'receive', label: 'Receive', icon: 'arrow-down-circle-outline', color: DS.colors.services.receive, route: '/receive' },
  { id: 'wallets', label: 'Wallets', icon: 'wallet-outline', color: DS.colors.services.wallets, route: '/wallets' },
  { id: 'cash-out', label: 'Cash Out', icon: 'cash-outline', color: DS.colors.services.cashOut, route: '/cash-out' },
  { id: 'vouchers', label: 'Vouchers', icon: 'gift-outline', color: DS.colors.services.vouchers, route: '/voucher' },
  { id: 'find-agent', label: 'Find Agent', icon: 'location-outline', color: DS.colors.services.findAgent, route: '/agents' },
  { id: 'loans', label: 'Loans', icon: 'business-outline', color: DS.colors.services.loans, route: '/loans' },
  { id: 'groups', label: 'Groups', icon: 'people-outline', color: DS.colors.services.groups, route: '/groups' },
  { id: 'bills', label: 'Bills', icon: 'document-text-outline', color: DS.colors.services.bills, route: '/bills' },
];
```

---

### 6. RecentContactsCarousel.tsx ✅
**Figma Specs:**
- Horizontal scroll
- Avatar: 40px circular
- Gap: 12px between contacts
- Name: 12px weight 500

**Features:**
- Horizontal scrollable contact chips
- 40px circular avatars (Figma ContactChip)
- Avatar image or initial letter
- Contact name below avatar
- Returns null if no contacts

**Props:**
```typescript
interface RecentContactsCarouselProps {
  contacts: Contact[];
  onContactPress: (contact: Contact) => void;
}
```

---

## Design System Integration

All components use the `designSystem` from `@/constants/designSystem.ts`:

### Colors
```typescript
DS.colors.text             // Primary text #020617
DS.colors.textSecondary    // Secondary text #64748B
DS.colors.background       // White #FFFFFF
DS.colors.border           // Border #E2E8F0
DS.colors.brand            // Smartpay teal #005D6E
```

### Spacing
```typescript
DS.spacing.horizontalPadding  // 16px
DS.spacing.sectionSpacing     // 32px
DS.spacing.md                 // 16px
DS.spacing.lg                 // 24px
```

### Components
```typescript
DS.components.balanceCard.height      // 120px
DS.components.walletCard.width        // 164px
DS.components.walletCard.height       // 140px
DS.components.serviceTile.iconSize    // 28px
DS.components.serviceTile.labelSize   // 13px
```

### Shadows
```typescript
DS.shadows.sm   // Wallet cards
DS.shadows.md   // Balance card
```

---

## Usage Example

```tsx
import {
  BalanceCard,
  WalletCarousel,
  ServicesGrid,
  RecentContactsCarousel,
} from '@/components/home';
import { designSystem as DS } from '@/constants/designSystem';

export default function HomeScreen() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  
  const services = [
    { id: 'proof-of-life', label: 'Proof of Life', icon: 'shield-checkmark-outline', color: DS.colors.services.proofOfLife, route: '/proof-of-life/intro' },
    // ... other services
  ];

  return (
    <ScrollView>
      <BalanceCard
        balance={1234.56}
        balanceVisible={balanceVisible}
        onToggleVisibility={() => setBalanceVisible(!balanceVisible)}
        walletName="Primary Wallet"
      />
      
      <WalletCarousel
        wallets={wallets}
        onWalletPress={(wallet) => router.push(`/wallets/${wallet.id}`)}
        onAddWallet={() => router.push('/add-wallet')}
      />
      
      <ServicesGrid
        services={services}
        onServicePress={(service) => router.push(service.route)}
      />
      
      <RecentContactsCarousel
        contacts={contacts}
        onContactPress={(contact) => router.push(`/send-money?recipientId=${contact.id}`)}
      />
    </ScrollView>
  );
}
```

---

## Accessibility

All components include:
- ✅ Proper `accessibilityLabel` attributes
- ✅ `accessibilityRole` for interactive elements
- ✅ Touch targets ≥44px (with hitSlop where needed)
- ✅ Screen reader announcements
- ✅ Contrast ratios meeting WCAG AA

---

## Component Dimensions Summary

| Component | Width | Height | Radius | Notes |
|-----------|-------|--------|--------|-------|
| BalanceCard | full | 120px | 12px | Figma spec |
| WalletCard | 164px | 140px | 16px | Figma spec |
| ServiceTile | ~110px | ~110px | 12px | Calculated |
| ContactChip | 40px | 40px | 20px | Circular |

---

## References

- **Design Skill:** `.cursor/skills-cursor/smartpay-design/SKILL.md`
- **Figma File:** VeGAwsChUvwTBZxAU6H8VQ (Buffr App Design)
- **Design System:** `mobile/constants/designSystem.ts`

---

**Status:** ✅ All 6 components implemented and matching Figma specifications
**Last Updated:** March 17, 2026
