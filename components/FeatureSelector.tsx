import React, { useState } from 'react';
import type { Feature } from '../types';
import { CustomFeatureInput } from './CustomFeatureInput';

interface FeatureSelectorProps {
  features: Feature[];
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  isDisabled: boolean;
}

const FeatureCard: React.FC<{ feature: Feature; onSelect: () => void; isDisabled: boolean }> = ({ feature, onSelect, isDisabled }) => {
  const disabledClasses = isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-cyan-400 hover:bg-gray-800/80';
  return (
    <button
      onClick={onSelect}
      disabled={isDisabled}
      className={`w-full text-left p-4 bg-gray-800/50 border border-gray-700 rounded-lg transition-all duration-200 ${disabledClasses}`}
    >
      <h3 className="font-semibold text-white">{feature.title}</h3>
      <p className="text-sm text-gray-400 mt-1">{feature.description}</p>
    </button>
  );
};


export const FeatureSelector: React.FC<FeatureSelectorProps> = ({ features, prompt, onPromptChange, onGenerate, isDisabled }) => {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate();
    }
  }

  return (
    <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl h-full flex flex-col">
      <h2 className="text-xl font-bold text-white mb-4">Describe Your Edit</h2>
      
      <CustomFeatureInput
        prompt={prompt}
        onPromptChange={onPromptChange}
        onSubmit={handleSubmit}
        isDisabled={isDisabled}
      />

      <div className="w-full flex items-center gap-2 my-4">
        <div className="flex-grow h-px bg-gray-700"></div>
        <span className="text-xs font-medium text-gray-500">OR GET INSPIRED</span>
        <div className="flex-grow h-px bg-gray-700"></div>
      </div>
      
      <div className="space-y-3 overflow-y-auto flex-grow">
        {features.map((feature) => (
          <FeatureCard 
            key={feature.title}
            feature={feature}
            onSelect={() => onPromptChange(feature.prompt)}
            isDisabled={isDisabled}
          />
        ))}
      </div>
    </div>
  );
};