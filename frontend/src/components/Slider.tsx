/**
 * 🎚️ Slider Component - Beautiful range slider with animations
 */

import React, { useState } from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  unit?: string;
  animated?: boolean;
}

const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label,
  unit = '',
  animated = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <span className="text-sm text-gray-600 font-semibold">
            {value}{unit}
          </span>
        </div>
      )}
      
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        {/* Progress fill */}
        <div
          className={`absolute h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-200 ${
            animated ? 'shadow-lg' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />

        {/* Slider input */}
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="absolute w-full h-2 top-0 left-0 cursor-pointer appearance-none bg-transparent z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-500 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer"
          style={{
            opacity: disabled ? 0.5 : 1,
          }}
        />
      </div>

      {/* Range labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};

export default Slider;
