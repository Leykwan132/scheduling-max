import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { Palette, Eye, Link2, Check, Package, Plus, Edit, Trash2, ArrowRight, User as UserIcon, ChevronDown, Search, Camera, Loader2 } from "lucide-react";
import { useQuery, useAction } from "wasp/client/operations";
import { useAuth } from "wasp/client/auth";
import { getBusinessByUser, getServicesByBusinessAndUserId, upsertBusiness, updateUserProfile, createService, updateService, deleteService, createFileUploadUrl, addFileToDb, getDownloadFileSignedURL, updateUserProfileImage } from "wasp/client/operations";
import { uploadFileWithProgress, validateFile } from "../../file-upload/fileUploading";
import { cn } from "../../client/utils";
import { ToastContainer, Toast } from "../../client/components/Toast";

// Helper function to format time from 24-hour to 12-hour format
const formatTime = (time: string): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return minutes > 0 ? `${displayHours}:${minutes.toString().padStart(2, '0')}${period}` : `${displayHours}${period}`;
};

const COUNTRY_CODES = [
    { code: "+1", country: "United States/Canada" },
    { code: "+7", country: "Russia/Kazakhstan" },
    { code: "+20", country: "Egypt" },
    { code: "+27", country: "South Africa" },
    { code: "+30", country: "Greece" },
    { code: "+31", country: "Netherlands" },
    { code: "+32", country: "Belgium" },
    { code: "+33", country: "France" },
    { code: "+34", country: "Spain" },
    { code: "+36", country: "Hungary" },
    { code: "+39", country: "Italy" },
    { code: "+40", country: "Romania" },
    { code: "+41", country: "Switzerland" },
    { code: "+43", country: "Austria" },
    { code: "+44", country: "United Kingdom" },
    { code: "+45", country: "Denmark" },
    { code: "+46", country: "Sweden" },
    { code: "+47", country: "Norway" },
    { code: "+48", country: "Poland" },
    { code: "+49", country: "Germany" },
    { code: "+51", country: "Peru" },
    { code: "+52", country: "Mexico" },
    { code: "+54", country: "Argentina" },
    { code: "+55", country: "Brazil" },
    { code: "+56", country: "Chile" },
    { code: "+57", country: "Colombia" },
    { code: "+58", country: "Venezuela" },
    { code: "+60", country: "Malaysia" },
    { code: "+61", country: "Australia" },
    { code: "+62", country: "Indonesia" },
    { code: "+63", country: "Philippines" },
    { code: "+64", country: "New Zealand" },
    { code: "+65", country: "Singapore" },
    { code: "+66", country: "Thailand" },
    { code: "+81", country: "Japan" },
    { code: "+82", country: "South Korea" },
    { code: "+84", country: "Vietnam" },
    { code: "+86", country: "China" },
    { code: "+90", country: "Turkey" },
    { code: "+91", country: "India" },
    { code: "+92", country: "Pakistan" },
    { code: "+93", country: "Afghanistan" },
    { code: "+94", country: "Sri Lanka" },
    { code: "+95", country: "Myanmar" },
    { code: "+98", country: "Iran" },
    { code: "+212", country: "Morocco" },
    { code: "+213", country: "Algeria" },
    { code: "+216", country: "Tunisia" },
    { code: "+218", country: "Libya" },
    { code: "+220", country: "Gambia" },
    { code: "+221", country: "Senegal" },
    { code: "+233", country: "Ghana" },
    { code: "+234", country: "Nigeria" },
    { code: "+254", country: "Kenya" },
    { code: "+255", country: "Tanzania" },
    { code: "+256", country: "Uganda" },
    { code: "+351", country: "Portugal" },
    { code: "+352", country: "Luxembourg" },
    { code: "+353", country: "Ireland" },
    { code: "+354", country: "Iceland" },
    { code: "+355", country: "Albania" },
    { code: "+358", country: "Finland" },
    { code: "+359", country: "Bulgaria" },
    { code: "+370", country: "Lithuania" },
    { code: "+371", country: "Latvia" },
    { code: "+372", country: "Estonia" },
    { code: "+380", country: "Ukraine" },
    { code: "+381", country: "Serbia" },
    { code: "+385", country: "Croatia" },
    { code: "+386", country: "Slovenia" },
    { code: "+420", country: "Czech Republic" },
    { code: "+421", country: "Slovakia" },
    { code: "+852", country: "Hong Kong" },
    { code: "+853", country: "Macau" },
    { code: "+855", country: "Cambodia" },
    { code: "+856", country: "Laos" },
    { code: "+880", country: "Bangladesh" },
    { code: "+886", country: "Taiwan" },
    { code: "+961", country: "Lebanon" },
    { code: "+962", country: "Jordan" },
    { code: "+963", country: "Syria" },
    { code: "+964", country: "Iraq" },
    { code: "+965", country: "Kuwait" },
    { code: "+966", country: "Saudi Arabia" },
    { code: "+967", country: "Yemen" },
    { code: "+968", country: "Oman" },
    { code: "+971", country: "UAE" },
    { code: "+972", country: "Israel" },
    { code: "+973", country: "Bahrain" },
    { code: "+974", country: "Qatar" },
    { code: "+975", country: "Bhutan" },
    { code: "+977", country: "Nepal" },
].sort((a, b) => a.country.localeCompare(b.country));

export default function BusinessSetupPage() {
    const { data: user } = useAuth();
    // Queries
    const { data: business, refetch: refetchBusiness } = useQuery(getBusinessByUser);
    const { data: services, refetch: refetchServices } = useQuery(getServicesByBusinessAndUserId, business?.id ? { businessId: business.id, userId: user?.id } : undefined, { enabled: !!business?.id && !!user?.id });

    // Actions
    const updateBusinessAction = useAction(upsertBusiness);
    const updateUserProfileAction = useAction(updateUserProfile);
    const createServiceAction = useAction(createService);
    const updateServiceAction = useAction(updateService);
    const deleteServiceAction = useAction(deleteService);
    const updateUserProfileImageAction = useAction(updateUserProfileImage);

    // Compute current user's profile image URL from business data
    const currentUserProfileImageUrl = useMemo(() => {
        if (!business?.users || !user?.id) return null;
        const currentUser = business.users.find((u: any) => u.id === user.id);
        return currentUser?.profileImageUrl || null;
    }, [business, user]);

    // State
    const [activeTab, setActiveTab] = useState<'profile' | 'services'>('profile');
    const [copied, setCopied] = useState(false);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [countrySearchQuery, setCountrySearchQuery] = useState("");
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; serviceId: string | null; serviceName: string }>({
        isOpen: false,
        serviceId: null,
        serviceName: ""
    });

    // User Profile Form State
    const [profileForm, setProfileForm] = useState({
        username: user?.username || "",
        slug: user?.slug || "",
        bio: user?.bio || "",
        phone: "",
        openingTime: "09:00",
        closingTime: "17:00",
        workDays: ["mon", "tue", "wed", "thu", "fri"] // Default work days
        // profileImage: user?.profileImage || "" 
    });

    // Update form when user data loads
    useEffect(() => {
        if (user) {
            setProfileForm(prev => ({
                ...prev,
                username: user.username || "",
                slug: user.slug || "",
                bio: user.bio || "",
                openingTime: user.openingTime || "09:00",
                closingTime: user.closingTime || "17:00",
                workDays: user.workDays ? user.workDays.split(',') : ["mon", "tue", "wed", "thu", "fri"]
            }));
        }
    }, [user]);

    useEffect(() => {
        if (business) {
            setProfileForm(prev => ({
                ...prev,
                phone: business.phone || ""
            }));
        }
    }, [business]);

    // Service Form State
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);
    const [serviceForm, setServiceForm] = useState({
        name: "",
        duration: 30,
        price: 0,
        description: "",
        isActive: true
    });

    const baseUrl = import.meta.env.REACT_APP_BASE_URL || window.location.origin;
    const bookingUrl = user?.slug ? `${baseUrl}/book/${user.slug}` : "";

    const handleCopyLink = () => {
        if (!bookingUrl) return;
        navigator.clipboard.writeText(bookingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const addToast = (message: string, type: 'success' | 'error') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploadingPhoto(true);
            setUploadProgress(0);

            // Validate file
            const validatedFile = validateFile(file);

            // Get presigned upload URL
            const { s3UploadUrl, s3UploadFields, s3Key } = await createFileUploadUrl({
                fileType: validatedFile.type,
                fileName: validatedFile.name,
            });

            // Upload to S3
            await uploadFileWithProgress({
                file: validatedFile,
                s3UploadUrl,
                s3UploadFields,
                setUploadProgressPercent: setUploadProgress,
            });

            // Save file to database
            const newFile = await addFileToDb({
                s3Key,
                fileType: validatedFile.type,
                fileName: validatedFile.name,
            });

            // Update user profile with new file ID
            await updateUserProfileImageAction({
                newFileId: newFile.id,
            });

            // Refetch business to update the profile image URL
            await refetchBusiness();

            addToast("Profile photo updated!", "success");

            // Reset file input
            e.target.value = "";
        } catch (error) {
            console.error("Error uploading photo:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to upload photo";
            addToast(errorMessage, "error");
        } finally {
            setIsUploadingPhoto(false);
            setUploadProgress(0);
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await updateUserProfileAction({
                username: profileForm.username,
                slug: profileForm.slug,
                bio: profileForm.bio,
                openingTime: profileForm.openingTime,
                closingTime: profileForm.closingTime,
                workDays: profileForm.workDays.join(',') // Convert array to comma-separated string
            });
            // Upsert business details for phone
            if (profileForm.phone) {
                await updateBusinessAction({
                    name: business?.name || profileForm.username || "My Business", // Fallback name
                    slug: profileForm.slug || user?.username || "business", // Fallback slug
                    phone: profileForm.phone
                });
            }

            addToast("Profile settings saved!", 'success');
        } catch (error: any) {
            addToast("Failed to save profile: " + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleServiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingService) {
                await updateServiceAction({
                    id: editingService.id,
                    ...serviceForm
                });
                addToast("Service updated!", 'success');
            } else {
                if (!business?.id) return;
                await createServiceAction({
                    businessId: business.id,
                    ...serviceForm
                });
                addToast("Service created!", 'success');
            }
            await refetchServices();
            setIsServiceModalOpen(false);
            setEditingService(null);
            setServiceForm({ name: "", duration: 30, price: 0, description: "", isActive: true });
        } catch (error: any) {
            addToast("Failed to save service: " + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteService = async () => {
        if (!deleteModal.serviceId) return;
        setIsDeleting(true);
        try {
            await deleteServiceAction({ id: deleteModal.serviceId });
            await refetchServices();
            addToast("Service deleted!", 'success');
            setDeleteModal({ isOpen: false, serviceId: null, serviceName: "" });
        } catch (error: any) {
            addToast("Failed to delete service", 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleActive = async (service: any) => {
        try {
            await updateServiceAction({
                id: service.id,
                isActive: !service.isActive
            });
            await refetchServices();
            addToast(`Service ${service.isActive ? 'disabled' : 'enabled'}!`, 'success');
        } catch (error: any) {
            addToast("Failed to toggle service status", 'error');
        }
    };

    const openServiceModal = (service?: any) => {
        if (service) {
            setEditingService(service);
            setServiceForm({
                name: service.name,
                duration: service.duration,
                price: service.price,
                description: service.description || "",
                isActive: service.isActive
            });
        } else {
            setEditingService(null);
            setServiceForm({ name: "", duration: 30, price: 0, description: "", isActive: true });
        }
        setIsServiceModalOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="w-full max-w-5xl mx-auto pb-20">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                            Business Setup
                        </h1>
                        <p className="text-muted-foreground mt-2 font-medium">
                            Manage your profile, services, and booking page.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCopyLink}
                            disabled={!bookingUrl}
                            className={cn(
                                "bg-yellow-200 text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 font-black text-sm uppercase",
                                !bookingUrl
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                            )}
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
                            className={cn(
                                "bg-white text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 font-black text-sm uppercase",
                                !bookingUrl
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                            )}
                        >
                            <Eye className="size-4" />
                            Preview
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-4 mb-8 border-b-2 border-black/10">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={cn(
                            "px-4 py-3 font-black text-sm uppercase border-b-4 transition-all",
                            activeTab === 'profile'
                                ? "border-black text-black"
                                : "border-transparent text-muted-foreground hover:text-black"
                        )}
                    >
                        Business Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('services')}
                        className={cn(
                            "px-4 py-3 font-black text-sm uppercase border-b-4 transition-all",
                            activeTab === 'services'
                                ? "border-black text-black"
                                : "border-transparent text-muted-foreground hover:text-black"
                        )}
                    >
                        Services
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {activeTab === 'profile' && (
                        <div className="bg-background border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-lg font-black uppercase mb-6 flex items-center gap-2">
                                <UserIcon className="size-5" />
                                My Profile
                            </h2>
                            <div className="space-y-6">
                                {/* Profile Image Upload */}
                                <div>
                                    <label className="block text-sm font-black uppercase mb-3">Profile Photo</label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative group">
                                            {/* Photo Display */}
                                            <div className="size-24 border-2 border-black bg-muted/30 overflow-hidden">
                                                {currentUserProfileImageUrl ? (
                                                    <img
                                                        src={currentUserProfileImageUrl}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <UserIcon className="size-10 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Hover Overlay */}
                                            <label
                                                htmlFor="profile-photo-upload"
                                                className={cn(
                                                    "absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer transition-opacity",
                                                    isUploadingPhoto ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                                )}
                                            >
                                                {isUploadingPhoto ? (
                                                    <div className="flex flex-col items-center">
                                                        <Loader2 className="size-6 text-white animate-spin" />
                                                        <span className="text-white text-xs font-bold mt-1">{uploadProgress}%</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Camera className="size-6 text-white" />
                                                        <span className="text-white text-xs font-bold mt-1">Change</span>
                                                    </>
                                                )}
                                            </label>

                                            {/* Hidden File Input */}
                                            <input
                                                id="profile-photo-upload"
                                                type="file"
                                                accept="image/jpeg,image/png"
                                                onChange={handleProfilePhotoUpload}
                                                disabled={isUploadingPhoto}
                                                className="hidden"
                                            />
                                        </div>

                                        <div className="text-sm">
                                            <p className="font-bold text-muted-foreground">Click to upload or hover to change</p>
                                            <p className="text-xs text-muted-foreground mt-1">JPEG or PNG, max 5MB</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Username/Name */}
                                <div>
                                    <label className="block text-sm font-black uppercase mb-3">Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.username}
                                        onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-black font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                                        placeholder="e.g. Max"
                                    />
                                </div>

                                {/* Booking URL Slug */}
                                <div>
                                    <label className="block text-sm font-black uppercase mb-3">Name your link</label>
                                    <input
                                        type="text"
                                        value={profileForm.slug}
                                        onChange={(e) => setProfileForm({ ...profileForm, slug: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-black font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                                        placeholder="e.g. max-barber"
                                    />
                                    <p className="mt-2 text-xs font-bold text-muted-foreground">
                                        Preview Link: <span className="text-black">{baseUrl.replace(/^https?:\/\//, '')}/book/{profileForm.slug || "your-slug"}</span>
                                    </p>
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="block text-sm font-black uppercase mb-3">Phone Number</label>
                                    <div className="flex gap-2">
                                        <div className="relative w-32 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsCountryDropdownOpen(!isCountryDropdownOpen);
                                                    setCountrySearchQuery("");
                                                }}
                                                className="w-full h-full px-4 py-2.5 border-2 border-black font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 flex items-center justify-between"
                                            >
                                                <span>
                                                    {COUNTRY_CODES.find(c => profileForm.phone?.startsWith(c.code))?.code || "+1"}
                                                </span>
                                                <ChevronDown className="size-4 text-black stroke-[3px]" />
                                            </button>

                                            {isCountryDropdownOpen && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-40"
                                                        onClick={() => setIsCountryDropdownOpen(false)}
                                                    />
                                                    <div className="absolute top-full left-0 mt-1 w-64 z-50 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                        <div className="p-2 border-b-2 border-black flex items-center gap-2 sticky top-0 bg-white">
                                                            <Search className="size-4 text-muted-foreground" />
                                                            <input
                                                                type="text"
                                                                value={countrySearchQuery}
                                                                onChange={(e) => setCountrySearchQuery(e.target.value)}
                                                                placeholder="Search country..."
                                                                className="w-full bg-transparent text-sm font-bold focus:outline-none"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="max-h-60 overflow-y-auto">
                                                            {COUNTRY_CODES
                                                                .filter(c =>
                                                                    c.country.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
                                                                    c.code.includes(countrySearchQuery)
                                                                )
                                                                .map((c) => (
                                                                    <button
                                                                        key={c.code}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newCode = c.code;
                                                                            const currentPhone = profileForm.phone || "";
                                                                            const oldCode = COUNTRY_CODES.find(curr => currentPhone.startsWith(curr.code))?.code || "+1";
                                                                            const numberPart = currentPhone.startsWith(oldCode)
                                                                                ? currentPhone.slice(oldCode.length).trim()
                                                                                : currentPhone;

                                                                            setProfileForm({ ...profileForm, phone: `${newCode} ${numberPart}` });
                                                                            setIsCountryDropdownOpen(false);
                                                                        }}
                                                                        className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-black hover:text-white transition-colors flex items-center justify-between group"
                                                                    >
                                                                        <span className="group-hover:translate-x-1 transition-transform">{c.country}</span>
                                                                        <span>{c.code}</span>
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            type="tel"
                                            value={(() => {
                                                const currentPhone = profileForm.phone || "";
                                                const code = COUNTRY_CODES.find(c => currentPhone.startsWith(c.code))?.code || "+1";
                                                return currentPhone.startsWith(code)
                                                    ? currentPhone.slice(code.length).trim()
                                                    : currentPhone;
                                            })()}
                                            onChange={(e) => {
                                                const numberPart = e.target.value;
                                                const currentPhone = profileForm.phone || "";
                                                const code = COUNTRY_CODES.find(c => currentPhone.startsWith(c.code))?.code || "+1";
                                                setProfileForm({ ...profileForm, phone: `${code} ${numberPart}` });
                                            }}
                                            className="flex-1 px-4 py-2.5 border-2 border-black font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                                            placeholder="234 567 890"
                                        />
                                    </div>
                                </div>

                                {/* Operation Hours */}
                                <div>
                                    <label className="block text-sm font-black uppercase mb-3">Operation Hours</label>

                                    {/* Work Days Selection */}
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase">Work Days</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => {
                                                        const currentDays = profileForm.workDays || [];
                                                        const newDays = currentDays.includes(day)
                                                            ? currentDays.filter(d => d !== day)
                                                            : [...currentDays, day];
                                                        setProfileForm({ ...profileForm, workDays: newDays });
                                                    }}
                                                    className={cn(
                                                        "size-10 border-2 border-black font-black text-xs uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
                                                        (profileForm.workDays || []).includes(day)
                                                            ? "bg-primary text-black"
                                                            : "bg-white text-muted-foreground hover:text-black"
                                                    )}
                                                >
                                                    {day.slice(0, 3)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Opening Time</label>
                                            <input
                                                type="time"
                                                value={profileForm.openingTime}
                                                onChange={(e) => setProfileForm({ ...profileForm, openingTime: e.target.value })}
                                                className="w-full px-4 py-2.5 border-2 border-black font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 appearance-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Closing Time</label>
                                            <input
                                                type="time"
                                                value={profileForm.closingTime}
                                                onChange={(e) => setProfileForm({ ...profileForm, closingTime: e.target.value })}
                                                className="w-full px-4 py-2.5 border-2 border-black font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 appearance-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Operation Hours Summary */}
                                    <p className="mt-3 text-xs font-bold text-muted-foreground">
                                        {(() => {
                                            const workDays = profileForm.workDays || [];
                                            const allDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                                            const dayNames = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

                                            if (workDays.length === 0) return 'No operation hours set';
                                            if (workDays.length === 7) {
                                                return `Open every day, ${formatTime(profileForm.openingTime)} - ${formatTime(profileForm.closingTime)}`;
                                            }

                                            // Find consecutive ranges
                                            const sortedDays = allDays.filter(d => workDays.includes(d));
                                            const notWorkingDays = allDays.filter(d => !workDays.includes(d));

                                            let daysText = '';
                                            if (sortedDays.length > 0) {
                                                const firstDay = dayNames[sortedDays[0] as keyof typeof dayNames];
                                                const lastDay = dayNames[sortedDays[sortedDays.length - 1] as keyof typeof dayNames];

                                                if (sortedDays.length === 1) {
                                                    daysText = firstDay;
                                                } else if (sortedDays.length === 2) {
                                                    daysText = `${firstDay} and ${lastDay}`;
                                                } else {
                                                    daysText = `${firstDay} - ${lastDay}`;
                                                }
                                            }

                                            // Add exceptions if any
                                            let exceptText = '';
                                            if (notWorkingDays.length > 0 && notWorkingDays.length < 7) {
                                                const exceptDayNames = notWorkingDays.map(d => dayNames[d as keyof typeof dayNames]);
                                                if (exceptDayNames.length === 1) {
                                                    exceptText = ` (Except ${exceptDayNames[0]})`;
                                                } else if (exceptDayNames.length === 2) {
                                                    exceptText = ` (Except ${exceptDayNames.join(' and ')})`;
                                                } else {
                                                    exceptText = ` (Except ${exceptDayNames.slice(0, -1).join(', ')} and ${exceptDayNames[exceptDayNames.length - 1]})`;
                                                }
                                            }

                                            return `Open from ${daysText}${exceptText}, ${formatTime(profileForm.openingTime)} - ${formatTime(profileForm.closingTime)}`;
                                        })()}
                                    </p>
                                </div>

                                {/* Bio */}
                                <div>
                                    <label className="block text-sm font-black uppercase mb-3">Bio / Description</label>
                                    <textarea
                                        value={profileForm.bio}
                                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-black font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 h-24 resize-none"
                                        placeholder="Brief bio for your booking page..."
                                    />
                                </div>

                                <div className="pt-4 border-t-2 border-black/10 flex justify-end">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                        className="bg-black text-white px-6 py-3 border-2 border-black font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? "Saving..." : "Save Profile"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'services' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={() => openServiceModal()}
                                    className="bg-primary text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center gap-2 font-black text-sm uppercase"
                                >
                                    <Plus className="size-4" />
                                    Add Service
                                </button>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {services && services.length > 0 ? (
                                    [...services].sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)).map((service: any) => (
                                        <div
                                            key={service.id}
                                            className={cn(
                                                "group relative bg-background border-2 border-black p-5 aspect-square flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all",
                                                !service.isActive && "opacity-60 grayscale-[0.5]"
                                            )}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="bg-primary p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                        <Package className="size-4 text-black" />
                                                    </div>
                                                    <span className={cn(
                                                        "px-1.5 py-0.5 text-[8px] font-black border-2 border-black uppercase whitespace-nowrap",
                                                        service.isActive ? "bg-green-200" : "bg-gray-200"
                                                    )}>
                                                        {service.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <h3 className="font-black text-sm uppercase leading-tight line-clamp-2">{service.name}</h3>
                                                {service.description && (
                                                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-tight">
                                                        {service.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-auto pt-2 border-t-2 border-black/5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xl font-black leading-none">${service.price}</p>
                                                    </div>
                                                    <div className="flex items-baseline gap-1">
                                                        <p className="text-xl font-black text-black leading-none italic">
                                                            {service.duration}
                                                        </p>
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase leading-none">
                                                            Mins
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openServiceModal(service)}
                                                        className="p-2 border-2 border-black bg-white hover:bg-muted transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]"
                                                        title="Edit Service"
                                                    >
                                                        <Edit className="size-4 text-black" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteModal({ isOpen: true, serviceId: service.id, serviceName: service.name })}
                                                        className="p-2 border-2 border-black bg-red-100 hover:bg-red-200 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]"
                                                        title="Delete Service"
                                                    >
                                                        <Trash2 className="size-4 text-red-600" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleActive(service)}
                                                    className={cn(
                                                        "px-3 py-1.5 border-2 border-black font-black text-[10px] uppercase transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]",
                                                        service.isActive ? "bg-gray-200 text-black" : "bg-green-400 text-black"
                                                    )}
                                                >
                                                    {service.isActive ? "Deactivate" : "Activate"}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-muted/20 border-2 border-dashed border-black p-12 text-center">
                                        <Package className="size-12 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-xl font-black uppercase mb-2">No Services Yet</h3>
                                        <p className="text-muted-foreground mb-4 font-medium">Add your first service to get started.</p>
                                        <button
                                            onClick={() => openServiceModal()}
                                            className="bg-primary text-black px-6 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-black text-sm uppercase"
                                        >
                                            Create Service
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Service Modal */}
            {isServiceModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
                        <div className="bg-primary px-6 py-4 border-b-4 border-black flex items-center justify-between">
                            <h2 className="text-xl font-black uppercase tracking-tight">
                                {editingService ? "Edit Service" : "New Service"}
                            </h2>
                            <button
                                onClick={() => setIsServiceModalOpen(false)}
                                className="p-2 hover:bg-black/10 transition-colors border-2 border-black bg-white"
                            >
                                <ArrowRight className="size-4" />
                            </button>
                        </div>
                        <form onSubmit={handleServiceSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-black uppercase mb-2">Service Name</label>
                                <input
                                    type="text"
                                    required
                                    value={serviceForm.name}
                                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-black font-bold focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="e.g. Haircut"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-black uppercase mb-2">Duration (min)</label>
                                    <input
                                        type="number"
                                        required
                                        min="5"
                                        step="5"
                                        value={serviceForm.duration}
                                        onChange={(e) => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border-2 border-black font-bold focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-black uppercase mb-2">Price ($)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={serviceForm.price}
                                        onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 border-2 border-black font-bold focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-black uppercase mb-2">Description</label>
                                <textarea
                                    value={serviceForm.description}
                                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-black font-bold focus:outline-none focus:ring-2 focus:ring-black h-24 resize-none"
                                    placeholder="Optional description..."
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={serviceForm.isActive}
                                    onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })}
                                    className="size-5 border-2 border-black rounded-sm accent-black"
                                />
                                <label htmlFor="isActive" className="text-sm font-black uppercase cursor-pointer">
                                    Active Service
                                </label>
                            </div>

                            <div className="pt-4 border-t-2 border-black/10 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsServiceModalOpen(false)}
                                    className="px-6 py-3 border-2 border-black font-black text-sm uppercase hover:bg-muted/50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-3 bg-black text-white border-2 border-black font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all disabled:opacity-70"
                                >
                                    {isSaving ? "Saving..." : (editingService ? "Update Service" : "Create Service")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm animate-in zoom-in-95 fade-in duration-200">
                        <div className="bg-red-500 px-6 py-4 border-b-4 border-black text-white">
                            <h2 className="text-xl font-black uppercase tracking-tight">Delete Service?</h2>
                        </div>
                        <div className="p-6">
                            <p className="font-bold mb-6">
                                Are you sure you want to delete <span className="uppercase text-red-600 underline">"{deleteModal.serviceName}"</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModal({ isOpen: false, serviceId: null, serviceName: "" })}
                                    className="flex-1 py-3 border-2 border-black font-black text-sm uppercase hover:bg-muted/50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteService}
                                    disabled={isDeleting}
                                    className="flex-1 py-3 bg-red-500 text-white border-2 border-black font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-70 transition-all"
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </DashboardLayout>
    );
}
