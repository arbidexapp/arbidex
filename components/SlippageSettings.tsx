'use client';

import { useState } from 'react';

interface SlippageSettingsProps {
  slippage: number;
  onChange: (value: number) => void;
}

const presetValues = [0.1, 0.5, 1.0];

export function SlippageSettings({ slippage, onChange }: SlippageSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState<string>('');

  const handlePresetClick = (value: number) => {
    onChange(value);
    setCustomValue('');
  };

  const handleCustomChange = (value: string) => {
    setCustomValue(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 50) {
      onChange(numValue);
    }
  };

  return (
    <div className="relative">
      {/* Pill button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
        Slippage: {slippage}%
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-orange-100 p-4 z-50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-gray-800 text-sm">Slippage tolerance</h4>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              {presetValues.map((value) => (
                <button
                  key={value}
                  onClick={() => handlePresetClick(value)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    slippage === value && !customValue
                      ? 'bg-orange-500 text-white'
                      : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                  }`}
                >
                  {value}%
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="number"
                value={customValue}
                onChange={(e) => handleCustomChange(e.target.value)}
                placeholder="Custom"
                step="0.1"
                min="0"
                max="50"
                className="w-full px-3 py-2 bg-orange-50 rounded-lg border border-orange-200 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 text-sm text-gray-800 placeholder-gray-400 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Transaction reverts if price moves more than this amount.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
