import DashboardLayout from "../layout/DashboardLayout";
import { Palette, Eye, Link2, Check } from "lucide-react";
import { useState } from "react";

export default function BookingPageEditorPage() {
    const [copied, setCopied] = useState(false);
    const bookingUrl = "https://schedulemax.com/book/demo-salon";

    const handleCopyLink = () => {
        navigator.clipboard.writeText(bookingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <DashboardLayout>
            <div className="w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                            Booking Page
                        </h1>
                        <p className="text-muted-foreground mt-2 font-medium">
                            Customize your public booking page.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCopyLink}
                            className="bg-yellow-200 text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center gap-2 font-black text-sm uppercase"
                        >
                            {copied ? (
                                <>
                                    <Check className="size-4" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Link2 className="size-4" />
                                    Copy Link
                                </>
                            )}
                        </button>
                        <button className="bg-white text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center gap-2 font-black text-sm uppercase">
                            <Eye className="size-4" />
                            Preview
                        </button>
                    </div>
                </div>

                {/* Brand Settings */}
                <div className="bg-background border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
                    <h2 className="text-lg font-black uppercase mb-6 flex items-center gap-2">
                        <Palette className="size-5" />
                        Brand Settings
                    </h2>
                    <div className="space-y-6">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-black uppercase mb-3">Logo</label>
                            <div className="border-2 border-dashed border-black p-8 text-center bg-muted/30">
                                <p className="text-sm font-bold text-muted-foreground mb-3">Upload your logo</p>
                                <button className="px-4 py-2 bg-primary border-2 border-black text-black font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                                    Choose File
                                </button>
                            </div>
                        </div>

                        {/* Brand Color */}
                        <div>
                            <label className="block text-sm font-black uppercase mb-3">Primary Color</label>
                            <div className="flex items-center gap-3">
                                <div className="w-16 h-16 border-2 border-black bg-primary shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"></div>
                                <input
                                    type="text"
                                    value="#FF88DC"
                                    className="flex-1 px-4 py-2.5 border-2 border-black font-mono text-sm font-bold bg-white"
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* Business Name */}
                        <div>
                            <label className="block text-sm font-black uppercase mb-3">Business Name</label>
                            <input
                                type="text"
                                value="ScheduleMax Demo Salon"
                                className="w-full px-4 py-2.5 border-2 border-black font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
