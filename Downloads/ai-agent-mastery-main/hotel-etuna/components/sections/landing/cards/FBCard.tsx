/**
 * Food & Beverage Card Component
 * 
 * Purpose: Reusable card component for displaying F&B types
 * Location: /components/sections/landing/cards/FBCard.tsx
 * 
 * Features:
 * - Large image header with gradient overlay
 * - Icon and text overlay on image
 * - Feature list below image
 * - Hover effects with image zoom
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Card shadows: shadow-lg with hover:shadow-xl
 * - Hover animation: image scale
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h3)
 * - Alt text for images
 * 
 * @param {Object} type - F&B type data object
 * @param {string} type.title - F&B type title
 * @param {string} type.subtitle - F&B type subtitle
 * @param {string[]} type.features - List of features
 * @param {string} type.image - Image URL
 * @param {React.ComponentType} type.icon - Icon component
 * 
 * @module FBCard
 */

import { ImagePlaceholder } from '@/components/ui';
import { CheckCircle2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface FBCardProps {
  title: string;
  subtitle: string;
  features: string[];
  image: string;
  icon: LucideIcon;
}

export default function FBCard({ title, subtitle, features, image, icon: Icon }: FBCardProps) {
  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative w-full h-64 overflow-hidden">
        <ImagePlaceholder
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          quality={75}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-base-100/95 via-base-100/50 to-transparent"></div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="w-16 h-16 rounded-xl bg-nude-500/90 backdrop-blur-sm flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold font-display mb-2 text-base-content">{title}</h3>
          <p className="text-base-content/90 mb-4">{subtitle}</p>
        </div>
      </div>
      <div className="card-body p-6">
        <ul className="space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-base-content/80">
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
