import React from 'react';

/**
 * SkeletonCard - Placeholder loading animation
 * Affiche un shimmer skeleton pendant le chargement des données
 */
export function SkeletonCard() {
  return (
    <div className="rounded border bg-white p-3">
      {/* Titre skeleton */}
      <div className="skeleton mb-2 h-4 w-1/2"></div>

      {/* Sous-titre skeleton */}
      <div className="skeleton mb-2 h-3 w-1/3"></div>

      {/* Contenu skeleton */}
      <div className="skeleton h-3 w-2/3"></div>
    </div>
  );
}

/**
 * SkeletonGrid - Grille de skeletons pour listes
 */
interface SkeletonGridProps {
  count?: number;
  columns?: number;
}

export function SkeletonGrid({ count = 6, columns = 2 }: SkeletonGridProps) {
  return (
    <div className={`grid gap-3 md:grid-cols-${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * SkeletonList - Liste linéaire de skeletons
 */
interface SkeletonListProps {
  count?: number;
}

export function SkeletonList({ count = 5 }: SkeletonListProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-1 rounded border bg-white p-3">
          <div className="skeleton h-4 w-3/4"></div>
          <div className="skeleton h-3 w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonText - Skeleton pour texte simple
 */
interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton h-3 ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  );
}

/**
 * SkeletonAvatar - Avatar skeleton circulaire
 */
interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg';
}

export function SkeletonAvatar({ size = 'md' }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div
      className={`skeleton rounded-full ${sizeClasses[size]}`}
    ></div>
  );
}

/**
 * SkeletonButton - Skeleton pour bouton
 */
interface SkeletonButtonProps {
  className?: string;
}

export function SkeletonButton({ className = '' }: SkeletonButtonProps) {
  return (
    <div className={`skeleton h-10 w-24 rounded ${className}`}></div>
  );
}
