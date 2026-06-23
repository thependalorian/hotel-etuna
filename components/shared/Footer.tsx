/**
 * Footer Component
 *
 * Purpose: Standardized footer used across all public pages.
 * Location: /components/shared/Footer.tsx
 */

import PublicFooter from '@/components/shared/PublicFooter';

type FooterProps = {
  className?: string;
};

const Footer = ({ className = '' }: FooterProps) => <PublicFooter className={className} />;

export default Footer;
