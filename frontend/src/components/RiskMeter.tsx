import { RiskLevel } from '@/lib/types';
import RiskBadge from './RiskBadge';
import { motion } from 'framer-motion';

interface RiskMeterProps {
  score: number;
  level: RiskLevel;
}

export default function RiskMeter({ score, level }: RiskMeterProps) {
  // Ensure score is within 0-100 bounds
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <div className="w-full select-none">
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Risk Score</span>
          <span className="text-3xl font-extrabold text-foreground">{clampedScore.toFixed(1)}%</span>
        </div>
        <RiskBadge level={level} size="lg" />
      </div>
      
      <div className="relative pt-4 pb-6">
        {/* The Animated Indicator Arrow */}
        <motion.div 
          className="absolute top-0 -ml-2"
          initial={{ left: 0 }}
          animate={{ left: `${clampedScore}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        >
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-foreground drop-shadow-md"></div>
        </motion.div>

        {/* The Gradient Bar */}
        <div className="h-3 w-full rounded-full overflow-hidden relative shadow-inner bg-gradient-to-r from-success via-warning to-destructive">
          {/* Threshold markers */}
          <div className="absolute top-0 bottom-0 left-[35%] w-0.5 bg-background/50 z-10" />
          <div className="absolute top-0 bottom-0 left-[65%] w-0.5 bg-background/50 z-10" />
        </div>
        
        {/* Labels */}
        <div className="flex justify-between text-[11px] font-medium text-muted-foreground mt-2 px-1">
          <span>0</span>
          <span>LOW</span>
          <span>MEDIUM</span>
          <span>HIGH</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}
