/**
 * Property Type Card Component
 * 
 * Purpose: Reusable card component for displaying accommodation types
 * Location: /components/sections/landing/cards/PropertyTypeCard.tsx
 * 
 * Features:
 * - Image header with icon overlay
 * - Title, subtitle, and feature list
 * - Hover effects with image zoom
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-200
 * - Card shadows: shadow-lg with hover:shadow-xl
 * - Hover animation: translateY(-2px) and image scale
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h3)
 * - Alt text for images
 * 
 * @param {Object} type - Property type data object
 * @param {string} type.title - Property type title
 * @param {string} type.subtitle - Property type subtitle
 * @param {string[]} type.features - List of features
 * @param {string} type.image - Image URL
 * @param {React.ComponentType} type.icon - Icon component
 * 
 * @module PropertyTypeCard
 */

import { ImagePlaceholder } from '@/components/ui';
import { CheckCircle2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface PropertyTypeCardProps {
  title: string;
  subtitle: string;
  features: string[];
  image: string;
  icon: LucideIcon;
}

export default function PropertyTypeCard({ title, subtitle, features, image, icon: Icon }: PropertyTypeCardProps) {
  return (
    <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group">
      <div className="relative w-full h-48 overflow-hidden">
        <ImagePlaceholder
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          quality={75}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-base-200/90 to-transparent"></div>
        <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-primary/90 backdrop-blur-sm flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary-content" />
        </div>
      </div>
      <div className="card-body p-6">
        <h3 className="text-2xl font-bold font-display mb-2">{title}</h3>
        <p className="text-base-content/90 mb-4">{subtitle}</p>
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
