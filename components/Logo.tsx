
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
    <div className={`${sizes[size]} ${className} relative flex items-center justify-center transition-transform hover:scale-105 duration-300`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          {/* Gradiente para a parte Verde */}
          <linearGradient id="gradGreen" x1="20" y1="44" x2="50" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00b34f" />
            <stop offset="100%" stopColor="#008037" />
          </linearGradient>
          
          {/* Gradiente para a parte Laranja */}
          <linearGradient id="gradOrange" x1="80" y1="44" x2="50" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff8a47" />
            <stop offset="100%" stopColor="#f37021" />
          </linearGradient>

          {/* Sombra interna para profundidade */}
          <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feOffset dx="1" dy="1" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadow" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
            <feBlend mode="normal" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Haste do Cadeado (Navy Blue Premium) */}
        <path 
          d="M32 40V28C32 18.0589 40.0589 10 50 10C59.9411 10 68 18.0589 68 28V36" 
          stroke="#10367a" 
          strokeWidth="10.5" 
          strokeLinecap="round"
          className="stroke-govblue dark:stroke-blue-600"
        />
        
        {/* Corpo do Cadeado (Squircle Shape) */}
        <g filter="url(#innerShadow)">
          {/* Base Verde (Superior Esquerda) */}
          <path 
            d="M20 54C20 47 25 42 32 42H68C75 42 80 47 80 54V78C80 85 75 90 68 90H32C25 90 20 85 20 78V54Z" 
            fill="url(#gradGreen)" 
          />
          
          {/* Divisão Diagonal Laranja (Inferior Direita) */}
          <path 
            d="M80 42L20 90H68C75 90 80 85 80 78V42Z" 
            fill="url(#gradOrange)" 
          />
        </g>

        {/* Cifrão ($) Minimalista e Elegante em Branco */}
        <g transform="translate(50, 66) scale(1.1)">
          {/* Traço vertical central do cifrão */}
          <path 
            d="M0 -14V14" 
            stroke="white" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
          />
          
          {/* Curvas do S com traço de design moderno */}
          <path 
            d="M7 -8.5C7 -8.5 6.5 -12 -0.5 -12C-7.5 -12 -7.5 -5.5 -0.5 -5.5C6.5 -5.5 6.5 1 -0.5 1C-7.5 1 -8 7.5 -8 7.5M8 -7.5C8 -7.5 7.5 -1C0.5 -1C-6.5 -1 -7 5.5 -7 5.5C-7 5.5 -6.5 9 0.5 9C7.5 9 7.5 5.5 7.5 5.5" 
            stroke="white" 
            strokeWidth="4" 
            strokeLinecap="round" 
            fill="none" 
            strokeLinejoin="round"
          />
        </g>

        {/* Pequeno detalhe de luz (Reflexo superior) */}
        <path 
          d="M28 46H45" 
          stroke="white" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          style={{ opacity: 0.3 }}
        />
      </svg>
    </div>
  );
};

export default Logo;
