
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const dims = {
  sm: { w: 26, h: 29 },
  md: { w: 34, h: 37 },
  lg: { w: 64, h: 70 },
  xl: { w: 96, h: 106 },
};

/**
 * Símbolo Destrava (rebrand 2026): cadeado se abrindo com o arco em âmbar
 * saltando para cima e um cifrão ($) no corpo — destravar o dinheiro e prosperar.
 */
export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const { w, h } = dims[size];
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <svg width={w} height={h} viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Destrava">
        {/* Arco do cadeado, aberto, saltando para cima (âmbar) */}
        <path d="M12 22 L12 15 A8 8 0 0 1 28 11.5" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
        {/* Corpo do cadeado (primária / teal) */}
        <rect x="7" y="21" width="26" height="20" rx="7" fill="var(--primary)" />
        {/* Cifrão */}
        <text x="20" y="37.5" textAnchor="middle" fontFamily="'Bricolage Grotesque Variable','Bricolage Grotesque',sans-serif" fontWeight="800" fontSize="18" fill="var(--primary-on)">$</text>
      </svg>
    </span>
  );
};

export default Logo;
