/**
 * PublicFooter Component
 *
 * Purpose: Canonical footer for all public pages.
 * Location: /components/shared/PublicFooter.tsx
 */
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

type PublicFooterProps = {
  className?: string;
};

export default function PublicFooter({ className = '' }: PublicFooterProps) {
  return (
    <footer className={`bg-terracotta-900 text-white py-12 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-khaki-600 rounded-full flex items-center justify-center font-display font-bold">
                HE
              </div>
              <span className="font-display text-xl font-bold">Hotel Etuna</span>
            </div>
            <p className="text-white/80 text-sm">He Takes Care of Us.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/rooms" className="text-white/80 hover:text-khaki-600 transition-colors">Rooms</Link></li>
              <li><Link href="/dining" className="text-white/80 hover:text-khaki-600 transition-colors">Dining</Link></li>
              <li><Link href="/tours" className="text-white/80 hover:text-khaki-600 transition-colors">Tours</Link></li>
              <li><Link href="/about" className="text-white/80 hover:text-khaki-600 transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-white/80 hover:text-khaki-600 transition-colors">Contact</Link></li>
              <li><Link href="/partners" className="text-white/80 hover:text-khaki-600 transition-colors">Referral Partners</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="text-white/80">5544 Valley of the Leopard Street, Ongwediva, Namibia</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <span className="text-white/80">+264 65 231 177 | +264 81 802 4833</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <a href="mailto:info@hoteletuna.com" className="text-white/80 hover:text-khaki-600 transition-colors">
                  info@hoteletuna.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/privacy" className="text-white/80 hover:text-khaki-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="text-white/80 hover:text-khaki-600 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-rustic/40 pt-8 text-sm text-white/70">
          © 2026 Hotel Etuna. He Takes Care of Us.
        </div>
      </div>
    </footer>
  );
}
