import React from "react";
import { cn } from "../../client/utils";

export interface GridFeature {
  name: string;
  description: string;
  icon?: React.ReactNode;
  emoji?: string;
  href?: string;
  size?: "small" | "medium" | "large";
}

interface FeaturesGridProps {
  features: GridFeature[];
  className?: string;
}

const FeaturesGrid = ({ features, className = "" }: FeaturesGridProps) => {
  return (
    <div className="mx-auto py-24 px-6 lg:px-8 max-w-7xl" id="features">
      {/* Header Section */}
      <div className="mb-20 space-y-6 text-center lg:text-left border-black dark:border-white">
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground uppercase italic leading-[0.9]">
          EVERYTHING <br className="hidden md:block" />
          <span className="bg-primary text-black px-4 inline-block transform -rotate-1 mt-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_white] border-2 border-black dark:border-white">
            BUILT IN.
          </span>
        </h2>
        <div className="max-w-2xl border-l-4 border-primary pl-6 py-2">
          <p className="text-xl md:text-2xl font-bold text-foreground leading-tight uppercase tracking-tight">
            We combined the best of automated scheduling with powerful staff management tools.
            <span className="text-primary italic ml-1 underline decoration-black/20">No plugins required.</span>
          </p>
        </div>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => (
          <div
            key={feature.name}
            className="group relative bg-white dark:bg-zinc-900 border-2 border-black dark:border-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_white] hover:-translate-y-1 hover:translate-x-1 hover:shadow-none transition-all duration-200"
          >
            <div className="mb-6 inline-flex items-center justify-center w-14 h-14 bg-primary border-2 border-black dark:border-white text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_white] transform -rotate-3 group-hover:rotate-0 transition-transform">
              {feature.emoji || "✨"}
            </div>

            <h3 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tighter italic">
              {feature.name}
            </h3>

            <div className="h-1 w-12 bg-primary mb-4" />

            <p className="text-muted-foreground font-medium leading-relaxed">
              {feature.description}
            </p>

            {/* Corner Accent */}
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-black/10 dark:border-white/10" />
          </div>
        ))}
      </div>

      {/* Bottom Accent Sticker */}
      <div className="mt-20 flex justify-center">
        <div className="bg-[#FFEB3B] text-[#0000FF] border-2 border-black px-6 py-3 font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-1 text-lg">
          🚀 SHIP FASTER, SELL MORE.
        </div>
      </div>
    </div>
  );
};

export default FeaturesGrid;
