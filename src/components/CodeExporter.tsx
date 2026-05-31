/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { VIPTier, WithdrawalConfig } from '../types';
import { 
  generateReactArrayCode, 
  generateJSONConfig, 
  generateHTMLCode, 
  generateWithdrawalBlockingCode 
} from '../utils';
import { 
  Code, 
  FileJson, 
  Layout, 
  Lock, 
  Copy, 
  Check, 
  Info,
  Terminal,
  ExternalLink
} from 'lucide-react';

interface CodeExporterProps {
  tiers: VIPTier[];
  withdrawalConfig: WithdrawalConfig;
  conversionRate: number;
}

export function CodeExporter({ tiers, withdrawalConfig, conversionRate }: CodeExporterProps) {
  const [activeTab, setActiveTab] = useState<'react' | 'json' | 'html' | 'checker'>('react');
  const [copied, setCopied] = useState(false);

  // Derive target string content
  const getCodeString = () => {
    switch (activeTab) {
      case 'react':
        return generateReactArrayCode(tiers, conversionRate);
      case 'json':
        return generateJSONConfig(tiers, withdrawalConfig, conversionRate);
      case 'html':
        return generateHTMLCode(tiers);
      case 'checker':
        return generateWithdrawalBlockingCode(withdrawalConfig);
      default:
        return '';
    }
  };

  const handleCopy = () => {
    const textToCopy = getCodeString();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-xl" id="code-exporter">
      {/* Header element matching Screenshot 2 */}
      <div className="p-5 border-b border-white/5 bg-slate-900/60 relative">
        <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-widest animate-pulse">
          Sincro Autómata
        </div>
        <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
          <Terminal className="h-5 w-5 text-sky-400" />
          Exportador de Membresías y Filtros (tappmusica)
        </h3>
        <p className="text-slate-400 text-xs mt-0.5 max-w-xl">
          ¿Tus usuarios hacen las tareas en un sitio hospedado externamente? Copia este código dinámico y colócalo allá. Los cambios de precio/premio se reflejan al instante.
        </p>
      </div>

      {/* Exporter selector tabs matching visual styling of screenshot 2 */}
      <div className="flex border-b border-white/5 bg-slate-950 p-1">
        <button
          type="button"
          id="export-tab-react"
          onClick={() => { setActiveTab('react'); setCopied(false); }}
          className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'react' 
              ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="h-3.5 w-3.5" />
          JavaScript / React Array
        </button>
        <button
          type="button"
          id="export-tab-json"
          onClick={() => { setActiveTab('json'); setCopied(false); }}
          className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'json' 
              ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileJson className="h-3.5 w-3.5" />
          JSON de Configuración
        </button>
        <button
          type="button"
          id="export-tab-html"
          onClick={() => { setActiveTab('html'); setCopied(false); }}
          className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'html' 
              ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layout className="h-3.5 w-3.5" />
          HTML Maquetación
        </button>
        <button
          type="button"
          id="export-tab-checker"
          onClick={() => { setActiveTab('checker'); setCopied(false); }}
          className={`flex-1 py-2 rounded-lg text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'checker' 
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          Filtro Antifraude (Retiros)
        </button>
      </div>

      {/* Code viewport block */}
      <div className="relative">
        {/* Float Action Floating Copy button */}
        <button
          type="button"
          id="btn-copy-code"
          onClick={handleCopy}
          className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg transition-all duration-300 ${
            copied 
              ? 'bg-emerald-500 text-slate-950 font-bold' 
              : 'bg-slate-900 border border-white/10 text-white hover:bg-slate-800'
          }`}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              ¡Copiado!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copiar Código
            </>
          )}
        </button>

        {/* Code Content Box styling */}
        <pre className="p-5 pt-14 bg-slate-950 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-[380px] scrollbar-thin rounded-b-xl border border-white/5 whitespace-pre selection:bg-sky-500/30">
          <code>{getCodeString()}</code>
        </pre>
      </div>

      {/* Informative Help Alert Banner identical to instructions shown in the bottom of Screenshot 2 */}
      <div className="p-4 bg-slate-950 border-t border-white/5 flex items-start gap-3">
        <span className="text-base text-yellow-400 leading-none mt-0.5">💡</span>
        <div className="space-y-1">
          <p className="text-xs font-bold text-white">
            Instrucciones para Kervin:
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {activeTab === 'react' && 'Copia el código en formato JavaScript / React Array y colócalo directamente en la maquetación o archivos de tareas de tu sitio web de tareas tappmusica. Esto garantiza que todos tus precios estén perfectamente idénticos y sincronizados entre ambas aplicaciones en un clic.'}
            {activeTab === 'json' && 'Este formato JSON es ideal para alimentar bases de datos, APIs de administración central o para guardar respaldos completos de la configuración de tus rangos VIP.'}
            {activeTab === 'html' && 'Este es un bloque HTML modular listo para pegar en tu landing page o maquetación principal. Está pre-estilizado en línea para que se vea moderno, receptivo y elegante en móviles.'}
            {activeTab === 'checker' && 'Implementa este filtro en los endpoints que procesan peticiones de retiro. Bloqueará de raíz a los usuarios o scripts automatizados de hackers que intenten forzar retiros fuera de los días establecidos.'}
          </p>
        </div>
      </div>
    </div>
  );
}
