import React, { useState, ChangeEvent } from 'react';
import { CloudArrowUp } from '@phosphor-icons/react';

interface FileUploadProps {
  onDataLoaded: (content: string) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        onDataLoaded(text);
      }
    };
    reader.readAsText(file);
  };

  // Pre-load with sample data based on user prompt context for demo purposes if they click the button
  const loadDemoData = () => {
      const sampleCSV = `OUVER ACESSIBILIDADE | FLUXO DE CAIXA,,,,,,,,,,,,
,Previsão,Realizado,Previsão,Realizado,Previsão,Realizado,Previsão,Realizado,Previsão,Realizado,Previsão,Realizado
,Julho,Julho,Agosto,Agosto,Setembro,Setembro,Outubro,Outubro,Novembro,Novembro,Dezembro,Dezembro
ENTRADAS,,,,,,,,,,,,
Vendas,"R$ 4.450,00","R$ 19.440,00","R$ 13.000,00",,"R$ 5.000,00","R$ 3.000,00","R$ 5.000,00","R$ 3.010,00","R$ 20.345,00",-,"R$ 6.645,00",-
TOTAL DAS ENTRADAS,"R$ 5.070,42","R$ 19.607,76","R$ 13.000,00","R$ 4.114,42","R$ 5.000,00","R$ 4.243,84","R$ 5.000,00","R$ 6.327,04","R$ 24.445,23","R$ 3.228,22","R$ 8.945,23","0,00"
TOTAL DAS SAÍDAS,"R$ 47.878,60","R$ 50.325,60","R$ 7.617,98","R$ 19.337,00","R$ 6.553,00","R$ 6.841,60","R$ 5.694,00","R$ 8.322,09","R$ 25.562,00","R$ 217,00","R$ 24.307,00","R$ 0,00"
1 (ENTRADAS - SAÍDAS),"-R$ 42.808,18","-R$ 30.717,84","R$ 5.382,02","-R$ 15.222,58","-R$ 1.553,00","-R$ 2.597,76","-R$ 694,00","-R$ 1.995,05","-R$ 1.116,77","R$ 3.011,22","-R$ 15.361,77","R$ 0,00"`;
      onDataLoaded(sampleCSV);
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${dragActive ? 'border-primary bg-primary-soft' : 'border-line bg-surface hover:bg-surface-2'}
        `}
        onDragEnter={handleDrag} 
        onDragLeave={handleDrag} 
        onDragOver={handleDrag} 
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          <CloudArrowUp size={40} weight="bold" className="mb-3 text-subtle" />
          <p className="mb-2 text-sm text-muted"><span className="font-semibold">Clique para enviar</span> ou arraste o arquivo CSV</p>
          <p className="text-xs text-muted">Suporta .CSV ou .TXT (Estrutura Fluxo de Caixa)</p>
        </div>
        <input type="file" className="absolute w-full h-full opacity-0 cursor-pointer" onChange={handleChange} accept=".csv,.txt" />
      </div>

      <div className="flex flex-col md:flex-row justify-center mt-4 gap-4">
          <button 
            onClick={loadDemoData}
            disabled={isLoading}
            className="text-sm text-primary hover:underline disabled:opacity-50"
          >
            Usar dados de exemplo (Demo)
          </button>
      </div>

      {isLoading && (
        <div className="mt-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p className="text-sm text-muted animate-pulse">A IA está analisando seus dados financeiros...</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;