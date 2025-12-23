
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`${sizes[size]} ${className} relative flex items-center justify-center`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Haste do Cadeado (Azul) - Estilo "Aberto" conforme imagem */}
        <path 
          d="M30 43V32C30 20.9543 38.9543 12 50 12C61.0457 12 70 20.9543 70 32V38" 
          stroke="#1351b4" 
          strokeWidth="10" 
          strokeLinecap="round"
          className="stroke-govblue dark:stroke-blue-500"
        />
        
        {/* Corpo do Cadeado - Divisão Diagonal */}
        {/* Parte Verde (Superior Esquerda) */}
        <path 
          d="M20 52C20 47.5817 23.5817 44 28 44H72C76.4183 44 80 47.5817 80 52V82C80 86.4183 76.4183 90 72 90H28C23.5817 90 20 86.4183 20 82V52Z" 
          fill="#009a44" 
          className="fill-govgreen"
        />
        
        {/* Parte Laranja (Inferior Direita - Corte Diagonal) */}
        <path 
          d="M80 44L20 90H72C76.4183 90 80 86.4183 80 82V44Z" 
          fill="#f37021" 
          className="fill-govorange"
        />

        {/* Símbolo do Cifrão ($) - Centralizado e Branco */}
        <g transform="translate(50, 67) scale(0.9)">
            {/* Linha vertical do cifrão */}
            <rect x="-1.5" y="-18" width="3" height="36" rx="1.5" fill="white" />
            
            {/* Desenho do S */}
            <path 
              d="M7.5 -10C7.5 -10 7 -14 -2 -14C-11 -14 -11 -6 -2 -6C7 -6 7 2 -2 2C-11 2 -11 10 -2 10C7 10 7.5 6 7.5 6" 
              stroke="white" 
              strokeWidth="5.5" 
              strokeLinecap="round" 
              fill="none" 
            />
        </g>
      </svg>
    </div>
  );
};

export default Logo;
