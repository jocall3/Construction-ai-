import React from 'react';

interface CustomFeatureInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isDisabled: boolean;
}

export const CustomFeatureInput: React.FC<CustomFeatureInputProps> = ({ prompt, onPromptChange, onSubmit, isDisabled }) => {

  return (
    <form onSubmit={onSubmit} className="relative">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={isDisabled}
          placeholder="First, select an area on the image. Then describe your change... e.g., 'add a white picket fence'"
          rows={3}
          className="w-full p-3 pr-24 text-sm text-white bg-gray-900/80 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Custom enhancement prompt"
        />
        <button
          type="submit"
          disabled={isDisabled || !prompt.trim()}
          className="absolute bottom-3 right-3 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate
        </button>
    </form>
  );
};