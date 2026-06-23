/**
 * Lists Hotel Etuna team email addresses (frontdesk, marketing, support, admin, founder).
 * Location: components/shared/HotelEtunaTeamEmails.tsx
 */

import { HOTEL_ETUNA_TEAM_EMAILS } from '@/lib/copy/contact-emails';

type HotelEtunaTeamEmailsProps = {
  className?: string;
  linkClassName?: string;
};

export default function HotelEtunaTeamEmails({
  className = 'space-y-4',
  linkClassName = 'hover:text-ci-primary transition-colors',
}: HotelEtunaTeamEmailsProps) {
  return (
    <ul className={className}>
      {HOTEL_ETUNA_TEAM_EMAILS.map((entry) => (
        <li key={entry.email}>
          <p className="font-semibold text-ci-secondary-chocolate">{entry.role}</p>
          <p className="text-sm text-ink-600 mb-1">{entry.description}</p>
          <a href={`mailto:${entry.email}`} className={`text-ci-accent-terracotta ${linkClassName}`}>
            {entry.email}
          </a>
        </li>
      ))}
    </ul>
  );
}
