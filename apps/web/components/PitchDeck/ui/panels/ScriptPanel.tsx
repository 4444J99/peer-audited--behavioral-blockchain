import React from 'react';

interface ScriptPanelProps {
  script: string;
}

export const ScriptPanel: React.FC<ScriptPanelProps> = ({ script }) => {
  return (
    <div className="text-neutral-300 text-base md:text-lg leading-relaxed font-serif animate-fade-in pb-8">
      {script.split('\n\n').map((paragraph, idx) => (
        <p key={idx} className="mb-4 md:mb-6">{paragraph}</p>
      ))}
    </div>
  );
};
