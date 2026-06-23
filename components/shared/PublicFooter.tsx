/**
 * PublicFooter Component
 *
 * Purpose: Canonical footer for all public pages.
 * Location: /components/shared/PublicFooter.tsx
 */
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { HotelEtunaLogo } from '@/components/brand/HotelEtunaLogo';
import { brand } from '@/lib/copy/brand';
import { publicCopy } from '@/lib/copy/public';
import { PublicAuthNav } from '@/components/shared/PublicAuthNav';

const STAFF_LOGIN_HREF = '/login?redirect=/dashboard';

type PublicFooterProps = {
  className?: string;
};

const footerHeadingClass = 'font-display text-nude-50 font-semibold text-base mb-4 tracking-tight';

const footerLinkClass =
  'text-nude-100 hover:text-ci-secondary-tan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ci-secondary-tan focus-visible:ring-offset-2 focus-visible:ring-offset-ci-secondary-chocolate rounded-sm transition-colors';

export default function PublicFooter({ className = '' }: PublicFooterProps) {
  return (
    <footer className={`bg-ci-secondary-chocolate text-nude-50 py-12 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          <div>
            <div className="mb-4">
              <HotelEtunaLogo size="md" variant="compact" href="/" onDark />
            </div>
            <p className="text-nude-100 font-signature text-lg">{brand.logoTagline}</p>
          </div>

          <div>
            <h4 className={footerHeadingClass}>Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/rooms" className={footerLinkClass}>Rooms</Link></li>
              <li><Link href="/facilities" className={footerLinkClass}>Facilities</Link></li>
              <li><Link href="/dining" className={footerLinkClass}>Dining</Link></li>
              <li><Link href="/partners" className={footerLinkClass}>Partners</Link></li>
              <li><Link href="/about" className={footerLinkClass}>About</Link></li>
              <li><Link href="/contact" className={footerLinkClass}>Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={footerHeadingClass}>Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-ci-secondary-tan" aria-hidden />
                <span className="text-nude-100">{brand.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-ci-secondary-tan" aria-hidden />
                <span className="text-nude-100">{brand.phones}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-ci-secondary-tan" aria-hidden />
                <a href={`mailto:${brand.emailFrontDesk}`} className={footerLinkClass}>
                  {brand.emailFrontDesk}
                </a>
              </li>
              <li className="text-nude-100/90 text-xs">
                <Link href="/contact#emails" className={footerLinkClass}>
                  All team emails
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className={footerHeadingClass}>{publicCopy.footer.forTeamHeading}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <PublicAuthNav variant="footer" />
              </li>
              <li>
                <Link
                  href={STAFF_LOGIN_HREF}
                  className={footerLinkClass}
                  aria-label={publicCopy.nav.staffLoginAria}
                >
                  {publicCopy.footer.staffLogin}
                </Link>
              </li>
            </ul>
            <p className="mt-3 text-xs text-nude-200/90 leading-relaxed">
              {publicCopy.footer.staffLoginHint}
            </p>
          </div>

          <div>
            <h4 className={footerHeadingClass}>Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/privacy" className={footerLinkClass}>Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className={footerLinkClass}>Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-nude-200/30 pt-8 text-sm text-nude-200">
          © {new Date().getFullYear()} {brand.name}. {brand.logoTagline}.
        </div>
      </div>
    </footer>
  );
}
