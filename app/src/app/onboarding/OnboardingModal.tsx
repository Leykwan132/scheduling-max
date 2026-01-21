import { useState } from "react";
import { completeOnboarding } from "wasp/client/operations";
import { ArrowRight, Building2, Users, GraduationCap, Heart, Briefcase, Loader2, Globe } from "lucide-react";

interface OnboardingModalProps {
    onComplete: () => void;
}

// Business type options
const businessTypes = [
    { id: "business", label: "Business", icon: Building2 },
    { id: "government", label: "Government", icon: Building2 },
    { id: "hobbyist", label: "Hobbyist or student", icon: GraduationCap },
    { id: "nonprofit", label: "Non-profit", icon: Heart },
    { id: "sole_proprietor", label: "Sole proprietor or self-employed", icon: Briefcase },
];

// Business category options
const businessCategories = [
    { id: "hair_salon", label: "Hair Salon / Barbershop", emoji: "💇" },
    { id: "spa_wellness", label: "Spa & Wellness", emoji: "💆" },
    { id: "nail_salon", label: "Nail Salon", emoji: "💅" },
    { id: "fitness", label: "Fitness / Yoga", emoji: "🧘" },
    { id: "medical", label: "Medical / Healthcare", emoji: "🩺" },
    { id: "beauty", label: "Beauty & Makeup", emoji: "🎨" },
    { id: "photography", label: "Photography", emoji: "📸" },
    { id: "home_services", label: "Home Services", emoji: "🏠" },
    { id: "tutoring", label: "Tutoring / Coaching", emoji: "🎓" },
    { id: "pet_services", label: "Pet Services", emoji: "🐕" },
    { id: "professional", label: "Professional Services", emoji: "🔧" },
    { id: "other", label: "Other", emoji: "➕" },
];

// Appointment type options
const appointmentTypes = [
    { id: "onsite", label: "In-person", description: "Clients visit your location" },
    { id: "online", label: "Virtual / Online", description: "Video calls or phone sessions" },
    { id: "both", label: "Both", description: "Mix of in-person and virtual" },
];

// Common timezones
const commonTimezones = [
    { value: "America/New_York", label: "Eastern Time (US & Canada)" },
    { value: "America/Chicago", label: "Central Time (US & Canada)" },
    { value: "America/Denver", label: "Mountain Time (US & Canada)" },
    { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
    { value: "Europe/London", label: "London" },
    { value: "Europe/Paris", label: "Paris, Berlin, Madrid" },
    { value: "Asia/Dubai", label: "Dubai" },
    { value: "Asia/Kolkata", label: "India" },
    { value: "Asia/Singapore", label: "Singapore" },
    { value: "Asia/Tokyo", label: "Tokyo" },
    { value: "Asia/Hong_Kong", label: "Hong Kong" },
    { value: "Australia/Sydney", label: "Sydney" },
    { value: "Pacific/Auckland", label: "Auckland" },
];

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form data
    const [businessType, setBusinessType] = useState<string>("");
    const [businessCategory, setBusinessCategory] = useState<string>("");
    const [businessName, setBusinessName] = useState<string>("");
    const [appointmentType, setAppointmentType] = useState<string>("");
    const [location, setLocation] = useState<string>("");
    const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const totalSteps = 7;
    const progressPercent = Math.round((step / totalSteps) * 100);

    const canProceed = () => {
        switch (step) {
            case 1: return businessType !== "";
            case 2: return businessCategory !== "";
            case 3: return businessName.trim() !== "";
            case 4: return appointmentType !== "";
            case 5: {
                // For onsite/both, require location input. For online, auto-proceed
                if (appointmentType === 'online') return true;
                return location.trim() !== "";
            }
            case 6: return timezone !== "";
            case 7: return true;
            default: return false;
        }
    };

    const handleNext = async () => {
        if (step < 7) {
            // Auto-skip location step if online is selected
            if (step === 4 && appointmentType === 'online') {
                setLocation('Remote');
                setStep(6); // Skip to timezone
            } else {
                setStep(step + 1);
            }
        } else {
            // Final step - submit
            setIsSubmitting(true);
            setError(null);
            try {
                await completeOnboarding({
                    businessName: businessName.trim(),
                    businessCategory,
                    businessType,
                    appointmentType,
                    location: appointmentType === 'online' ? 'Remote' : location.trim(),
                    timezone,
                });
                onComplete();
            } catch (err: any) {
                setError(err.message || "Something went wrong. Please try again.");
                setIsSubmitting(false);
            }
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header with progress */}
                <div className="p-4 border-b-2 border-black/10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            Personalize your onboarding <span className="text-lg">✨</span>
                        </span>
                        <span className="text-sm font-bold text-muted-foreground">{progressPercent}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Step 1: Business Type */}
                    {step === 1 && (
                        <div>
                            <h2 className="text-xl font-black mb-6">Which best describes you?</h2>
                            <div className="space-y-3">
                                {businessTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setBusinessType(type.id)}
                                        className={`w-full flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${businessType === type.id
                                            ? "border-primary bg-primary/10"
                                            : "border-black/20 hover:border-black/40"
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${businessType === type.id
                                            ? "border-primary bg-primary"
                                            : "border-black/30"
                                            }`}>
                                            {businessType === type.id && (
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            )}
                                        </div>
                                        <span className="font-medium">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Business Category */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-xl font-black mb-6">What type of business do you run?</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {businessCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setBusinessCategory(cat.id)}
                                        className={`flex items-center gap-2 p-3 border-2 rounded-xl transition-all text-left ${businessCategory === cat.id
                                            ? "border-primary bg-primary/10"
                                            : "border-black/20 hover:border-black/40"
                                            }`}
                                    >
                                        <span className="text-xl">{cat.emoji}</span>
                                        <span className="text-sm font-medium">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Business Name */}
                    {step === 3 && (
                        <div>
                            <h2 className="text-xl font-black mb-6">What's your business name?</h2>
                            <input
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                placeholder="Enter your business name"
                                className="w-full px-4 py-3 border-2 border-black rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                                autoFocus
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                                This will be displayed on your booking page
                            </p>
                        </div>
                    )}

                    {/* Step 4: Appointment Type */}
                    {step === 4 && (
                        <div>
                            <h2 className="text-xl font-black mb-6">Are your appointments mostly onsite or online?</h2>
                            <div className="space-y-3">
                                {appointmentTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setAppointmentType(type.id)}
                                        className={`w-full flex items-center gap-3 p-4 border-2 rounded-xl transition-all text-left ${appointmentType === type.id
                                            ? "border-primary bg-primary/10"
                                            : "border-black/20 hover:border-black/40"
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${appointmentType === type.id
                                            ? "border-primary bg-primary"
                                            : "border-black/30"
                                            }`}>
                                            {appointmentType === type.id && (
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-medium">{type.label}</span>
                                            <p className="text-sm text-muted-foreground">{type.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Location (only for onsite/both) */}
                    {step === 5 && (
                        <div>
                            <h2 className="text-xl font-black mb-2">Where do you provide your services?</h2>
                            <p className="text-sm text-muted-foreground mb-6">
                                Enter your business address or service location
                            </p>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g., 123 Main Street, New York, NY 10001"
                                className="w-full px-4 py-3 border-2 border-black rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                                autoFocus
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                                This will be included in appointment confirmations
                            </p>
                        </div>
                    )}

                    {/* Step 6: Timezone */}
                    {step === 6 && (
                        <div>
                            <h2 className="text-xl font-black mb-2">What's your timezone?</h2>
                            <p className="text-sm text-muted-foreground mb-6">
                                This ensures your booking times are displayed correctly
                            </p>
                            <div className="space-y-2">
                                <select
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-black rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    {commonTimezones.map((tz) => (
                                        <option key={tz.value} value={tz.value}>
                                            {tz.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Globe className="size-3" />
                                    Detected: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 7: Confirmation */}
                    {step === 7 && (
                        <div>
                            <h2 className="text-xl font-black mb-6">You're all set! 🎉</h2>
                            <div className="bg-muted p-4 rounded-xl border-2 border-black/10 space-y-3">
                                <div>
                                    <span className="text-xs font-bold text-muted-foreground uppercase">Business Name</span>
                                    <p className="font-medium">{businessName}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-muted-foreground uppercase">Category</span>
                                    <p className="font-medium">
                                        {businessCategories.find(c => c.id === businessCategory)?.emoji}{" "}
                                        {businessCategories.find(c => c.id === businessCategory)?.label}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-muted-foreground uppercase">Type</span>
                                    <p className="font-medium capitalize">{businessType.replace(/_/g, " ")}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-muted-foreground uppercase">Appointments</span>
                                    <p className="font-medium">
                                        {appointmentTypes.find(t => t.id === appointmentType)?.label}
                                    </p>
                                </div>
                            </div>
                            {error && (
                                <div className="mt-4 p-3 bg-red-100 border-2 border-red-500 rounded-xl text-red-700 text-sm">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer with navigation */}
                <div className="p-4 border-t-2 border-black/10 flex items-center justify-between">
                    {step > 1 ? (
                        <button
                            onClick={handleBack}
                            className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                            disabled={isSubmitting}
                        >
                            Back
                        </button>
                    ) : (
                        <div />
                    )}
                    <button
                        onClick={handleNext}
                        disabled={!canProceed() || isSubmitting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-black border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold uppercase tracking-wider text-sm hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Creating...
                            </>
                        ) : step === 5 ? (
                            "Get Started"
                        ) : (
                            <>
                                Next
                                <ArrowRight className="size-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
