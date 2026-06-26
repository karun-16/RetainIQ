import React, { ReactNode } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
}

export function InfoTooltip({ content }: TooltipProps) {
  return (
    <div className="relative group inline-block ml-1">
      <Info className="w-3.5 h-3.5 text-muted-foreground/70 hover:text-foreground cursor-help transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border border-border z-50 pointer-events-none">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border"></div>
      </div>
    </div>
  );
}

export function LabelWithTooltip({ label, tooltip }: { label: string, tooltip: string }) {
  return (
    <label className="flex items-center text-xs font-medium text-muted-foreground mb-1">
      {label}
      <InfoTooltip content={tooltip} />
    </label>
  );
}
