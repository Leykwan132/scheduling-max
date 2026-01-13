import DashboardLayout from "../layout/DashboardLayout";
import { Palette, Eye, Link2, Check } from "lucide-react";
import { useState } from "react";

import { useAuth } from "wasp/client/auth";

export default function BookingPageEditorPage() {
    const { data: user } = useAuth();
    const [copied, setCopied] = useState(false);

    const baseUrl = import.meta.env.REACT_APP_BASE_URL || window.location.origin;
    const bookingUrl = user?.slug ? `${baseUrl}/book/${user.slug}` : "";

    const handleCopyLink = () => {
        if (!bookingUrl) return;
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
                            disabled={!bookingUrl}
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
                        <button
                            onClick={() => bookingUrl && window.open(bookingUrl, '_blank')}
                            disabled={!bookingUrl}
                            className="bg-white text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center gap-2 font-black text-sm uppercase"
                        >
                            <Eye className="size-4" />
                            Preview
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-yellow-100 border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
                    <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                        <Link2 className="size-5" />
                        Booking Page Link
                    </h2>
                    <p className="font-medium text-sm mb-4">
                        Share this link with your customers to let them book appointments with you.
                        Customize your business details in the <a href="/app/business-setup" className="underline font-bold">Business Setup</a> page.
                    </p>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={bookingUrl || "Loading..."}
                            readOnly
                            className="flex-1 px-4 py-2.5 border-2 border-black font-mono text-sm font-bold bg-white"
                        />
                        <button
                            onClick={handleCopyLink}
                            disabled={!bookingUrl}
                            className="bg-black text-white px-4 py-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all font-black text-xs uppercase"
                        >
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
