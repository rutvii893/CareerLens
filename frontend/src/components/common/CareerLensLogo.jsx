import React from 'react';
import { Link } from 'react-router-dom';
import CareerLensLogoAsset from '../../assets/careerlens-logo.png';

/**
 * CareerLensLogo - Reusable primary brand logo component.
 *
 * Props:
 * - variant: 'full' | 'icon' (default: 'full')
 * - size: 'navbar' | 'auth' | 'sidebar' | 'mobile' | 'hero' | 'custom' (default: 'navbar')
 * - className: custom Tailwind classes
 * - to: link destination (default: '/')
 * - clickable: whether the logo wraps in a Link (default: true)
 */
const CareerLensLogo = ({
  variant = 'full',
  size = 'navbar',
  className = '',
  to = '/',
  clickable = true,
}) => {
  // Dimension configurations preserving square 1:1 aspect ratio
  const sizeClasses = {
    navbar: 'h-11 w-11 sm:h-12 sm:w-12',
    mobile: 'h-9 w-9',
    auth: 'h-24 w-24 sm:h-28 sm:w-28',
    sidebar: 'h-10 w-10',
    hero: 'h-24 w-24 md:h-28 md:w-28',
    custom: '',
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.navbar;
  const logoSrc = CareerLensLogoAsset;

  const logoContent = (
    <div className={`inline-flex items-center shrink-0 ${className}`}>
      <img
        src={logoSrc}
        alt="CareerLens"
        className={`aspect-square object-contain shrink-0 bg-white ${selectedSizeClass}`}
      />
    </div>
  );

  if (clickable && to) {
    return (
      <Link to={to} className="inline-flex items-center focus:outline-none shrink-0 group" aria-label="CareerLens Home">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

export default CareerLensLogo;
