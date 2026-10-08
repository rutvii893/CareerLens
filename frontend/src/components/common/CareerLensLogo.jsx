import React from 'react';
import { Link } from 'react-router-dom';
import CareerLensLogoAsset from '../../assets/CareerLens Growth Vision Logo.png';

/**
 * CareerLensLogo - Reusable primary brand logo component.
 *
 * Props:
 * - variant: 'full' | 'icon' (default: 'full')
 * - size: 'navbar' | 'auth' | 'sidebar' | 'mobile' | 'custom' (default: 'navbar')
 * - className: custom Tailwind classes
 * - to: link destination (default: '/')
 */
const CareerLensLogo = ({
  variant = 'full',
  size = 'navbar',
  className = '',
  to = '/',
  clickable = true,
}) => {
  // Height configurations for brand logo presentation
  const sizeClasses = {
    navbar: 'h-10 sm:h-11 md:h-12',
    mobile: 'h-8 sm:h-9',
    auth: 'h-16 md:h-20',
    sidebar: 'h-10 sm:h-11',
    hero: 'h-20 md:h-24',
    custom: '',
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.navbar;
  const logoSrc = CareerLensLogoAsset;

  const getHeight = () => {
    switch (size) {
      case 'auth':
        return '72px';
      case 'hero':
        return '88px';
      case 'sidebar':
        return '44px';
      case 'mobile':
        return '36px';
      case 'navbar':
      default:
        return '46px';
    }
  };

  const targetHeight = getHeight();

  const logoContent = (
    <div className={`inline-flex items-center shrink-0 ${className}`}>
      <img
        src={logoSrc}
        alt="CareerLens Logo"
        className={`w-auto object-contain shrink-0 transition-all duration-200 ${selectedSizeClass}`}
        style={{
          height: targetHeight,
          maxHeight: targetHeight,
          width: 'auto',
        }}
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
