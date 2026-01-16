import { cn } from "../../client/utils";

interface ComparisonFeature {
    name: string;
    calcom: { value: string; available: boolean };
    acuity: { value: string; available: boolean };
    ours: { value: string; available: boolean };
}

const features: ComparisonFeature[] = [
    {
        name: "Pricing Model",
        calcom: { value: "Sub", available: true },
        acuity: { value: "Monthly", available: true },
        ours: { value: "Lifetime", available: true },
    },
    {
        name: "Staff Roles",
        calcom: { value: "Limited", available: false },
        acuity: { value: "Tiered", available: false },
        ours: { value: "Built-in", available: true },
    },
    {
        name: "Multi-Location",
        calcom: { value: "Add-on", available: false },
        acuity: { value: "Paid Tier", available: false },
        ours: { value: "Included", available: true },
    },
    {
        name: "Client Tipping",
        calcom: { value: "No", available: false },
        acuity: { value: "Basic", available: false },
        ours: { value: "Smart", available: true },
    },
    {
        name: "Review Collection",
        calcom: { value: "No", available: false },
        acuity: { value: "Email Only", available: false },
        ours: { value: "Auto-Push", available: true },
    },
    {
        name: "Bundled Pkgs",
        calcom: { value: "No", available: false },
        acuity: { value: "Complex", available: false },
        ours: { value: "Easy", available: true },
    },
];

export default function ComparisonTable() {
    return (
        <div className="py-24 px-6 lg:px-8 max-w-5xl mx-auto">
            <div className="text-center mb-16 space-y-4">
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground uppercase italic px-4 inline-block transform -rotate-1">
                    Why switch from Acuity?
                </h2>
                <div className="flex justify-center">
                    <p className="text-xl font-bold bg-primary text-black px-4 py-1 inline-block transform rotate-1 border-2 border-black uppercase tracking-wider">
                        More features. Zero monthly fees.
                    </p>
                </div>
            </div>

            <div className="relative">
                {/* Brutalist Shadow Decor */}
                <div className="absolute inset-0 bg-black dark:bg-white translate-x-2 translate-y-2" />

                <div className="relative overflow-hidden border-2 border-black dark:border-white bg-white dark:bg-zinc-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-black dark:border-white">
                                    <th className="p-6 text-sm font-black uppercase tracking-widest text-muted-foreground bg-zinc-50 dark:bg-zinc-800/50">Feature</th>
                                    <th className="p-6 text-sm font-black uppercase tracking-widest text-center text-muted-foreground bg-zinc-50 dark:bg-zinc-800/50">Cal.com</th>
                                    <th className="p-6 text-sm font-black uppercase tracking-widest text-center text-muted-foreground bg-zinc-50 dark:bg-zinc-800/50 border-r-2 border-black dark:border-white">Acuity</th>
                                    <th className="p-6 text-lg font-black uppercase italic tracking-tighter text-center text-black bg-primary">
                                        MorphScheduling
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-black dark:divide-white">
                                {features.map((feature) => (
                                    <tr key={feature.name} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="p-6 text-base font-black uppercase tracking-tight text-foreground border-r-2 border-black dark:border-white">{feature.name}</td>

                                        {/* Cal.com */}
                                        <td className="p-6 text-center font-bold text-muted-foreground/60 border-r-2 border-black dark:border-white">
                                            {feature.calcom.value}
                                        </td>

                                        {/* Acuity */}
                                        <td className="p-6 text-center font-bold text-muted-foreground/60 border-r-2 border-black dark:border-white">
                                            {feature.acuity.value}
                                        </td>

                                        {/* Ours */}
                                        <td className="p-6 text-center font-black text-black bg-primary/40 group-hover:bg-primary/60 transition-colors">
                                            <span className="bg-black text-white px-2 py-1 transform -rotate-1 inline-block">
                                                {feature.ours.value}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="mt-12 flex justify-center">
                <div className="bg-[#FFEB3B] text-[#0000FF] border-2 border-black p-4 font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1 text-sm">
                    ⚠️ Acuity users typically save $300+/year by switching.
                </div>
            </div>
        </div>
    );
}
