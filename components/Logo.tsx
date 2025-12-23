
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };

  return (
    <div className={`${sizes[size]} ${className} relative flex items-center justify-center transition-transform duration-300`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Haste do Cadeado - Aberta no lado direito (Navy Blue) */}
        <path 
          d="M30 44V32C30 20.9543 38.9543 12 50 12C61.0457 12 70 20.9543 70 32V38" 
          stroke="#1d357d" 
          strokeWidth="11" 
          strokeLinecap="round"
        />
        
        {/* Corpo do Cadeado com Cantos Arredondados */}
        <mask id="bodyMask">
          <rect x="20" y="44" width="60" height="46" rx="8" fill="white" />
        </mask>

        <g mask="url(#bodyMask)">
          {/* Parte Verde (Superior Esquerda) */}
          <path 
            d="M20 44H80V90H20V44Z" 
            fill="#2e9e42" 
          />
          
          {/* Parte Laranja (Divisão Diagonal Inferior Direita) */}
          <path 
            d="M85 44L20 95H85V44Z" 
            fill="#f58220" 
          />
        </g>

        {/* Seta Branca Centralizada apontando para cima */}
        <path 
          d="M50 48L38 64H46V78H54V64H62L50 48Z" 
          fill="white"
        />
      </svg>
    </div>
  );
};

export default Logo;
