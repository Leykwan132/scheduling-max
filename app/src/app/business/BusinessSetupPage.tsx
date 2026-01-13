import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { Palette, Eye, Link2, Check, Package, Plus, Edit, Trash2, ArrowRight, User as UserIcon, ChevronDown, Search, Camera, Loader2, Clock, Copy, Calendar, Globe, Phone, Mail, Instagram, Facebook, X } from "lucide-react";
import { useQuery, useAction } from "wasp/client/operations";
import { useAuth } from "wasp/client/auth";
import { getBusinessByUser, getServicesByBusinessAndUserId, upsertBusiness, updateUserProfile, createService, updateService, deleteService, createFileUploadUrl, addFileToDb, getDownloadFileSignedURL, updateUserProfileImage, getSchedule, updateSchedule, updateScheduleOverride } from "wasp/client/operations";
import { uploadFileWithProgress, validateFile } from "../../file-upload/fileUploading";
import { cn } from "../../client/utils";
import { ToastContainer, Toast } from "../../client/components/Toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format } from "date-fns";

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
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
    const [editingOverrideId, setEditingOverrideId] = useState<string | null>(null);

    const { data: user } = useAuth();
    // Queries
    const { data: business, refetch: refetchBusiness } = useQuery(getBusinessByUser);
    const { data: services, refetch: refetchServices } = useQuery(getServicesByBusinessAndUserId, business?.id ? { businessId: business.id, userId: user?.id } : undefined, { enabled: !!business?.id && !!user?.id });
    const { data: schedule, refetch: refetchSchedule } = useQuery(getSchedule);

    // Actions
    const updateBusinessAction = useAction(upsertBusiness);
    const updateUserProfileAction = useAction(updateUserProfile);
    const createServiceAction = useAction(createService);
    const updateServiceAction = useAction(updateService);
    const deleteServiceAction = useAction(deleteService);
    const updateUserProfileImageAction = useAction(updateUserProfileImage);
    const updateScheduleAction = useAction(updateSchedule);
    const updateScheduleOverrideAction = useAction(updateScheduleOverride);

    // Compute current user's profile image URL from business data
    const currentUserProfileImageUrl = useMemo(() => {
        if (!business?.users || !user?.id) return null;
        const currentUser = business.users.find((u: any) => u.id === user.id);
        return currentUser?.profileImageUrl || null;
    }, [business, user]);

    // State
    const [activeTab, setActiveTab] = useState<'profile' | 'services' | 'availability'>('profile');
    const [copied, setCopied] = useState(false);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [countrySearchQuery, setCountrySearchQuery] = useState("");
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isAddContactOpen, setIsAddContactOpen] = useState(false);
    const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
    const [timezoneSearchQuery, setTimezoneSearchQuery] = useState("");

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
        workDays: ["mon", "tue", "wed", "thu", "fri"], // Default work days
        // specific contact fields
        instagramUrl: "",
        isInstagramEnabled: false,
        tiktokUrl: "",
        isTikTokEnabled: false,
        facebookUrl: "",
        isFacebookEnabled: false,
        websiteUrl: "",
        isWebsiteEnabled: false,
        contactEmail: "",
        isContactEmailEnabled: false,
        isPhoneEnabled: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
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
                workDays: user.workDays ? user.workDays.split(',') : ["mon", "tue", "wed", "thu", "fri"],
                timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
            }));
        }
    }, [user]);

    useEffect(() => {
        if (business) {
            setProfileForm(prev => ({
                ...prev,
                phone: business.phone || "",
                instagramUrl: business.instagramUrl || "",
                isInstagramEnabled: !!business.instagramUrl && (business.isInstagramEnabled ?? false),
                tiktokUrl: business.tiktokUrl || "",
                isTikTokEnabled: !!business.tiktokUrl && (business.isTikTokEnabled ?? false),
                facebookUrl: business.facebookUrl || "",
                isFacebookEnabled: !!business.facebookUrl && (business.isFacebookEnabled ?? false),
                websiteUrl: business.websiteUrl || "",
                isWebsiteEnabled: !!business.websiteUrl && (business.isWebsiteEnabled ?? false),
                contactEmail: business.contactEmail || "",
                isContactEmailEnabled: !!business.contactEmail && (business.isContactEmailEnabled ?? false),
                isPhoneEnabled: business.isPhoneEnabled ?? true
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

    // Availability Schedule State
    const [scheduleDays, setScheduleDays] = useState<{ dayOfWeek: string; startTime: string; endTime: string }[]>([]);
    const [overrides, setOverrides] = useState<any[]>([]);
    const [timezone, setTimezone] = useState("UTC");
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
    const [overrideForm, setOverrideForm] = useState({ dates: [] as string[], isUnavailable: false, startTime: "09:00", endTime: "17:00" });
    const [selectedDates, setSelectedDates] = useState<Date[] | undefined>([]);

    // Track initial state for dirty checking
    const [initialScheduleState, setInitialScheduleState] = useState<string>("");

    useEffect(() => {
        if (schedule) {
            setScheduleDays(schedule.days || []);
            setOverrides(schedule.overrides || []);
            setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);

            // Set initial state string for comparison
            setInitialScheduleState(JSON.stringify({
                days: schedule.days || []
            }));
        } else {
            // Default if no schedule loaded yet
            setScheduleDays([]);
        }
    }, [schedule]);

    const isScheduleDirty = useMemo(() => {
        if (!initialScheduleState) return false;
        const currentState = JSON.stringify({ days: scheduleDays });
        return currentState !== initialScheduleState;
    }, [scheduleDays, initialScheduleState]);

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
            // Validation for Social/Contact fields
            if (profileForm.isPhoneEnabled && !profileForm.phone.trim()) {
                addToast("Please enter a phone number or remove it.", "error");
                setIsSaving(false);
                return;
            }
            if (profileForm.isContactEmailEnabled && !profileForm.contactEmail.trim()) {
                addToast("Please enter an email or remove it.", "error");
                setIsSaving(false);
                return;
            }
            if (profileForm.isWebsiteEnabled && !profileForm.websiteUrl.trim()) {
                addToast("Please enter a website URL or remove it.", "error");
                setIsSaving(false);
                return;
            }
            if (profileForm.isInstagramEnabled && !profileForm.instagramUrl.trim()) {
                addToast("Please enter an Instagram URL or remove it.", "error");
                setIsSaving(false);
                return;
            }
            if (profileForm.isTikTokEnabled && !profileForm.tiktokUrl.trim()) {
                addToast("Please enter a TikTok URL or remove it.", "error");
                setIsSaving(false);
                return;
            }
            if (profileForm.isFacebookEnabled && !profileForm.facebookUrl.trim()) {
                addToast("Please enter a Facebook URL or remove it.", "error");
                setIsSaving(false);
                return;
            }

            await updateUserProfileAction({
                username: profileForm.username,
                slug: profileForm.slug,
                bio: profileForm.bio,
                openingTime: profileForm.openingTime,
                closingTime: profileForm.closingTime,
                workDays: profileForm.workDays.join(',') // Convert array to comma-separated string
            });

            // Upsert business details
            await updateBusinessAction({
                name: business?.name || profileForm.username || "My Business", // Fallback name
                slug: profileForm.slug || user?.username || "business", // Fallback slug
                phone: profileForm.phone,
                instagramUrl: profileForm.instagramUrl,
                isInstagramEnabled: profileForm.isInstagramEnabled,
                tiktokUrl: profileForm.tiktokUrl,
                isTikTokEnabled: profileForm.isTikTokEnabled,
                facebookUrl: profileForm.facebookUrl,
                isFacebookEnabled: profileForm.isFacebookEnabled,
                websiteUrl: profileForm.websiteUrl,
                isWebsiteEnabled: profileForm.isWebsiteEnabled,
                contactEmail: profileForm.contactEmail,
                isContactEmailEnabled: profileForm.isContactEmailEnabled,
                isPhoneEnabled: profileForm.isPhoneEnabled,
            });

            addToast("Profile settings saved!", 'success');
        } catch (error: any) {
            addToast("Failed to save profile: " + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTimezoneChange = async (newTimezone: string) => {
        setProfileForm(prev => ({ ...prev, timezone: newTimezone }));
        setIsTimezoneOpen(false);
        try {
            await updateUserProfileAction({
                timezone: newTimezone
            });
            addToast("Timezone updated!", 'success');
        } catch (error: any) {
            addToast("Failed to update timezone: " + error.message, 'error');
        }
    };

    const handleSaveSchedule = async () => {
        if (!schedule?.id) return;
        setIsSaving(true);
        try {
            await updateScheduleAction({
                scheduleId: schedule.id,
                days: scheduleDays
            });
            await refetchSchedule();
            addToast("Availability saved!", 'success');
        } catch (error: any) {
            addToast("Failed to save changes: " + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddSlot = (day: string) => {
        setScheduleDays([...scheduleDays, { dayOfWeek: day, startTime: "09:00", endTime: "17:00" }]);
    };

    const handleRemoveSlot = (day: string, indexWithinDay: number) => {
        // We need to find the correct index in the main array
        // Filter slots for this day
        const daySlots = scheduleDays.map((s, i) => ({ ...s, originalIndex: i })).filter(s => s.dayOfWeek === day);
        if (daySlots[indexWithinDay]) {
            const indexToRemove = daySlots[indexWithinDay].originalIndex;
            const newDays = [...scheduleDays];
            newDays.splice(indexToRemove, 1);
            setScheduleDays(newDays);
        }
    };

    const handleUpdateSlot = (day: string, indexWithinDay: number, field: 'startTime' | 'endTime', value: string) => {
        const daySlots = scheduleDays.map((s, i) => ({ ...s, originalIndex: i })).filter(s => s.dayOfWeek === day);
        if (daySlots[indexWithinDay]) {
            const indexToUpdate = daySlots[indexWithinDay].originalIndex;
            const newDays = [...scheduleDays];
            newDays[indexToUpdate] = { ...newDays[indexToUpdate], [field]: value };
            setScheduleDays(newDays);
        }
    };

    const handleToggleDay = (day: string, enable: boolean) => {
        if (enable) {
            const hasSlot = scheduleDays.some(d => d.dayOfWeek === day);
            if (!hasSlot) {
                setScheduleDays([...scheduleDays, { dayOfWeek: day, startTime: "09:00", endTime: "17:00" }]);
            }
        } else {
            setScheduleDays(scheduleDays.filter(d => d.dayOfWeek !== day));
        }
    };

    const handleEditOverride = (override: any) => {
        setSelectedDates([new Date(override.date)]);
        setOverrideForm({
            dates: [], // This will be overwritten by selectedDates
            isUnavailable: override.isUnavailable,
            startTime: override.startTime || "09:00",
            endTime: override.endTime || "17:00"
        });
        setEditingOverrideId(override.id);
        setIsOverrideModalOpen(true);
    };

    const handleDeleteOverride = (id: string) => {
        setDeleteConfirmationId(id);
    };

    const confirmDeleteOverride = async () => {
        if (!deleteConfirmationId || !schedule?.id) return;
        setIsSaving(true);
        try {
            await updateScheduleOverrideAction({
                scheduleId: schedule.id,
                id: deleteConfirmationId,
                dates: [], // Not used for delete action
                isUnavailable: false, // Not used for delete action
                action: 'delete'
            });
            await refetchSchedule();
            addToast("Override deleted!", "success");
            setDeleteConfirmationId(null);
        } catch (error: any) {
            addToast("Failed to delete override: " + error.message, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveOverride = async () => {
        if (!schedule?.id) return;
        const formattedDates = (selectedDates || []).map(d => format(d, 'yyyy-MM-dd'));
        if (formattedDates.length === 0) {
            addToast("Please select at least one date", "error");
            return;
        }
        setIsSaving(true);
        try {
            await updateScheduleOverrideAction({
                scheduleId: schedule.id,
                id: editingOverrideId || undefined, // Pass ID if editing
                dates: formattedDates,
                isUnavailable: overrideForm.isUnavailable,
                startTime: overrideForm.isUnavailable ? undefined : overrideForm.startTime,
                endTime: overrideForm.isUnavailable ? undefined : overrideForm.endTime,
                action: editingOverrideId ? 'upsert' : 'upsert' // Action is upsert for both create and update
            });
            await refetchSchedule();
            setIsOverrideModalOpen(false);
            setOverrideForm({ dates: [], isUnavailable: false, startTime: "09:00", endTime: "17:00" }); // Reset
            setSelectedDates([]);
            setEditingOverrideId(null); // Reset editing state
            addToast("Override saved!", "success");
        } catch (error: any) {
            addToast("Failed to save override: " + error.message, "error");
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

    const hasChanges = useMemo(() => {
        if (!user) return false;
        const biz = business || {};

        // User fields
        if (profileForm.username !== (user.username || "")) return true;
        if (profileForm.slug !== (user.slug || "")) return true;
        if (profileForm.bio !== (user.bio || "")) return true;
        if (profileForm.openingTime !== (user.openingTime || "09:00")) return true;
        if (profileForm.closingTime !== (user.closingTime || "17:00")) return true;

        const userWorkDays = user.workDays ? user.workDays.split(',') : ["mon", "tue", "wed", "thu", "fri"];
        if (JSON.stringify(profileForm.workDays) !== JSON.stringify(userWorkDays)) return true;

        // Business fields
        if (profileForm.phone !== (biz.phone || "")) return true;
        if (profileForm.isPhoneEnabled !== (biz.isPhoneEnabled ?? true)) return true;

        // Socials - using the same logic as the useEffect for initial state
        const checkSocial = (url: string, enabled: boolean, dbUrl: string | undefined | null, dbEnabled: boolean | undefined | null) => {
            if (url !== (dbUrl || "")) return true;
            const initialEnabled = !!dbUrl && (dbEnabled ?? false);
            if (enabled !== initialEnabled) return true;
            return false;
        };

        if (checkSocial(profileForm.instagramUrl, profileForm.isInstagramEnabled, biz.instagramUrl, biz.isInstagramEnabled)) return true;
        if (checkSocial(profileForm.tiktokUrl, profileForm.isTikTokEnabled, biz.tiktokUrl, biz.isTikTokEnabled)) return true;
        if (checkSocial(profileForm.facebookUrl, profileForm.isFacebookEnabled, biz.facebookUrl, biz.isFacebookEnabled)) return true;
        if (checkSocial(profileForm.websiteUrl, profileForm.isWebsiteEnabled, biz.websiteUrl, biz.isWebsiteEnabled)) return true;
        if (checkSocial(profileForm.contactEmail, profileForm.isContactEmailEnabled, biz.contactEmail, biz.isContactEmailEnabled)) return true;

        return false;
    }, [profileForm, user, business]);

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
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('availability')}
                        className={cn(
                            "px-4 py-3 font-black text-sm uppercase border-b-4 transition-all",
                            activeTab === 'availability'
                                ? "border-black text-black"
                                : "border-transparent text-muted-foreground hover:text-black"
                        )}
                    >
                        Availability
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

                                {/* Contact & Socials Section */}
                                <div className="pt-8 border-t-2 border-black/10">
                                    <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                                        <Globe className="size-5" />
                                        Contact & Socials
                                    </h3>

                                    <div className="space-y-6">
                                        {/* Phone Number */}
                                        {profileForm.isPhoneEnabled && (
                                            <div className="bg-gray-50 p-4 border-2 border-black/5 rounded-lg relative group">
                                                <button
                                                    onClick={() => setProfileForm({ ...profileForm, isPhoneEnabled: false, phone: "" })}
                                                    className="absolute top-2 right-2 p-1 hover:bg-black hover:text-white transition-colors rounded-full"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Phone className="size-4" />
                                                    <label className="text-sm font-black uppercase">Phone Number</label>
                                                </div>
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
                                        )}

                                        {/* Contact Email */}
                                        {profileForm.isContactEmailEnabled && (
                                            <div className="bg-gray-50 p-4 border-2 border-black/5 rounded-lg relative group">
                                                <button
                                                    onClick={() => setProfileForm({ ...profileForm, isContactEmailEnabled: false, contactEmail: "" })}
                                                    className="absolute top-2 right-2 p-1 hover:bg-black hover:text-white transition-colors rounded-full"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Mail className="size-4" />
                                                    <label className="text-sm font-black uppercase">Public Contact Email</label>
                                                </div>
                                                <input
                                                    type="email"
                                                    value={profileForm.contactEmail}
                                                    onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                                                    className="w-full px-4 py-2.5 border-2 border-black font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                                                    placeholder="contact@example.com"
                                                />
                                            </div>
                                        )}

                                        {/* Website */}
                                        {profileForm.isWebsiteEnabled && (
                                            <div className="bg-gray-50 p-4 border-2 border-black/5 rounded-lg relative group">
                                                <button
                                                    onClick={() => setProfileForm({ ...profileForm, isWebsiteEnabled: false, websiteUrl: "" })}
                                                    className="absolute top-2 right-2 p-1 hover:bg-black hover:text-white transition-colors rounded-full"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Globe className="size-4" />
                                                    <label className="text-sm font-black uppercase">Website URL</label>
                                                </div>
                                                <input
                                                    type="url"
                                                    value={profileForm.websiteUrl}
                                                    onChange={(e) => setProfileForm({ ...profileForm, websiteUrl: e.target.value })}
                                                    className="w-full px-4 py-2.5 border-2 border-black font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                                                    placeholder="https://example.com"
                                                />
                                            </div>
                                        )}

                                        {/* Instagram */}
                                        {profileForm.isInstagramEnabled && (
                                            <div className="bg-gray-50 p-4 border-2 border-black/5 rounded-lg relative group">
                                                <button
                                                    onClick={() => setProfileForm({ ...profileForm, isInstagramEnabled: false, instagramUrl: "" })}
                                                    className="absolute top-2 right-2 p-1 hover:bg-black hover:text-white transition-colors rounded-full"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Instagram className="size-4" />
                                                    <label className="text-sm font-black uppercase">Instagram URL</label>
                                                </div>
                                                <input
                                                    type="url"
                                                    value={profileForm.instagramUrl}
                                                    onChange={(e) => setProfileForm({ ...profileForm, instagramUrl: e.target.value })}
                                                    className="w-full px-4 py-2.5 border-2 border-black font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                                                    placeholder="https://instagram.com/username"
                                                />
                                            </div>
                                        )}

                                        {/* TikTok */}
                                        {profileForm.isTikTokEnabled && (
                                            <div className="bg-gray-50 p-4 border-2 border-black/5 rounded-lg relative group">
                                                <button
                                                    onClick={() => setProfileForm({ ...profileForm, isTikTokEnabled: false, tiktokUrl: "" })}
                                                    className="absolute top-2 right-2 p-1 hover:bg-black hover:text-white transition-colors rounded-full"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="size-4 flex items-center justify-center font-black text-[8px] border-2 border-current rounded-full">TT</div>
                                                    <label className="text-sm font-black uppercase">TikTok URL</label>
                                                </div>
                                                <input
                                                    type="url"
                                                    value={profileForm.tiktokUrl}
                                                    onChange={(e) => setProfileForm({ ...profileForm, tiktokUrl: e.target.value })}
                                                    className="w-full px-4 py-2.5 border-2 border-black font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                                                    placeholder="https://tiktok.com/@username"
                                                />
                                            </div>
                                        )}

                                        {/* Facebook */}
                                        {profileForm.isFacebookEnabled && (
                                            <div className="bg-gray-50 p-4 border-2 border-black/5 rounded-lg relative group">
                                                <button
                                                    onClick={() => setProfileForm({ ...profileForm, isFacebookEnabled: false, facebookUrl: "" })}
                                                    className="absolute top-2 right-2 p-1 hover:bg-black hover:text-white transition-colors rounded-full"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Facebook className="size-4" />
                                                    <label className="text-sm font-black uppercase">Facebook URL</label>
                                                </div>
                                                <input
                                                    type="url"
                                                    value={profileForm.facebookUrl}
                                                    onChange={(e) => setProfileForm({ ...profileForm, facebookUrl: e.target.value })}
                                                    className="w-full px-4 py-2.5 border-2 border-black font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                                                    placeholder="https://facebook.com/username"
                                                />
                                            </div>
                                        )}

                                        {/* Add Button */}
                                        {(!profileForm.isPhoneEnabled || !profileForm.isContactEmailEnabled || !profileForm.isWebsiteEnabled || !profileForm.isInstagramEnabled || !profileForm.isTikTokEnabled || !profileForm.isFacebookEnabled) && (
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddContactOpen(!isAddContactOpen)}
                                                    className="flex items-center gap-2 text-sm font-black uppercase border-2 border-dashed border-black/30 px-4 py-3 w-full hover:border-black hover:bg-gray-50 transition-all text-muted-foreground hover:text-black"
                                                >
                                                    <Plus className="size-4" />
                                                    Add Contact or Social Link
                                                </button>

                                                {isAddContactOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setIsAddContactOpen(false)} />
                                                        <div className="absolute top-full left-0 w-full mt-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20 py-2">
                                                            {!profileForm.isPhoneEnabled && (
                                                                <button
                                                                    onClick={() => { setProfileForm({ ...profileForm, isPhoneEnabled: true }); setIsAddContactOpen(false); }}
                                                                    className="w-full text-left px-4 py-2 font-bold hover:bg-gray-100 flex items-center gap-3"
                                                                >
                                                                    <Phone className="size-4" /> Phone Number
                                                                </button>
                                                            )}
                                                            {!profileForm.isContactEmailEnabled && (
                                                                <button
                                                                    onClick={() => { setProfileForm({ ...profileForm, isContactEmailEnabled: true }); setIsAddContactOpen(false); }}
                                                                    className="w-full text-left px-4 py-2 font-bold hover:bg-gray-100 flex items-center gap-3"
                                                                >
                                                                    <Mail className="size-4" /> Email
                                                                </button>
                                                            )}
                                                            {!profileForm.isWebsiteEnabled && (
                                                                <button
                                                                    onClick={() => { setProfileForm({ ...profileForm, isWebsiteEnabled: true }); setIsAddContactOpen(false); }}
                                                                    className="w-full text-left px-4 py-2 font-bold hover:bg-gray-100 flex items-center gap-3"
                                                                >
                                                                    <Globe className="size-4" /> Website
                                                                </button>
                                                            )}
                                                            {!profileForm.isInstagramEnabled && (
                                                                <button
                                                                    onClick={() => { setProfileForm({ ...profileForm, isInstagramEnabled: true }); setIsAddContactOpen(false); }}
                                                                    className="w-full text-left px-4 py-2 font-bold hover:bg-gray-100 flex items-center gap-3"
                                                                >
                                                                    <Instagram className="size-4" /> Instagram
                                                                </button>
                                                            )}
                                                            {!profileForm.isTikTokEnabled && (
                                                                <button
                                                                    onClick={() => { setProfileForm({ ...profileForm, isTikTokEnabled: true }); setIsAddContactOpen(false); }}
                                                                    className="w-full text-left px-4 py-2 font-bold hover:bg-gray-100 flex items-center gap-3"
                                                                >
                                                                    <div className="size-4 flex items-center justify-center font-black text-[8px] border-2 border-current rounded-full">TT</div> TikTok
                                                                </button>
                                                            )}
                                                            {!profileForm.isFacebookEnabled && (
                                                                <button
                                                                    onClick={() => { setProfileForm({ ...profileForm, isFacebookEnabled: true }); setIsAddContactOpen(false); }}
                                                                    className="w-full text-left px-4 py-2 font-bold hover:bg-gray-100 flex items-center gap-3"
                                                                >
                                                                    <Facebook className="size-4" /> Facebook
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
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

                                {hasChanges && (
                                    <div className="pt-4 border-t-2 border-black/10 flex justify-end animate-in fade-in slide-in-from-bottom-2">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={isSaving}
                                            className="bg-black text-white px-6 py-3 border-2 border-black font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all disabled:opacity-50"
                                        >
                                            {isSaving ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'availability' && (
                        <div className="bg-background border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Header */}
                            <h2 className="text-lg font-black uppercase mb-6 flex items-center gap-2">
                                <Clock className="size-5" />
                                Availability Schedule
                            </h2>

                            {/* Timezone Display */}
                            <div className="mb-8">
                                <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase">Timezone</label>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsTimezoneOpen(!isTimezoneOpen)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 border-2 border-black font-bold text-sm bg-white hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Globe className="size-4 text-muted-foreground" />
                                            <span>{profileForm.timezone}</span>
                                        </div>
                                        <ChevronDown className={cn("size-4 transition-transform", isTimezoneOpen && "rotate-180")} />
                                    </button>

                                    {isTimezoneOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 max-h-60 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                            <div className="p-2 border-b-2 border-black/10 sticky top-0 bg-white z-10">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search timezone..."
                                                        value={timezoneSearchQuery}
                                                        onChange={(e) => setTimezoneSearchQuery(e.target.value)}
                                                        className="w-full pl-9 pr-3 py-2 text-sm font-bold border-2 border-black/20 focus:border-black focus:outline-none transition-colors"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto flex-1 p-1">
                                                {Intl.supportedValuesOf('timeZone')
                                                    .filter(tz => tz.toLowerCase().includes(timezoneSearchQuery.toLowerCase()))
                                                    .map((tz) => (
                                                        <button
                                                            key={tz}
                                                            onClick={() => handleTimezoneChange(tz)}
                                                            className={cn(
                                                                "w-full text-left px-3 py-2 text-sm font-bold hover:bg-black hover:text-white transition-colors flex items-center justify-between group",
                                                                profileForm.timezone === tz && "bg-black/5"
                                                            )}
                                                        >
                                                            {tz}
                                                            {profileForm.timezone === tz && (
                                                                <Check className="size-4 opacity-100 group-hover:text-white" />
                                                            )}
                                                        </button>
                                                    ))}
                                                {Intl.supportedValuesOf('timeZone').filter(tz => tz.toLowerCase().includes(timezoneSearchQuery.toLowerCase())).length === 0 && (
                                                    <div className="p-4 text-center text-sm font-bold text-muted-foreground">
                                                        No timezones found
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>



                            {/* Weekly Hours */}
                            <div className="space-y-6 mb-8">
                                <div className="flex items-center justify-between border-b-2 border-black/10 pb-2">
                                    <h3 className="text-sm font-black uppercase">Weekly Hours</h3>
                                    <button
                                        onClick={() => {
                                            if (confirm("Reset to standard business hours (Mon-Fri, 9am-5pm)?")) {
                                                setScheduleDays([
                                                    { dayOfWeek: "mon", startTime: "09:00", endTime: "17:00" },
                                                    { dayOfWeek: "tue", startTime: "09:00", endTime: "17:00" },
                                                    { dayOfWeek: "wed", startTime: "09:00", endTime: "17:00" },
                                                    { dayOfWeek: "thu", startTime: "09:00", endTime: "17:00" },
                                                    { dayOfWeek: "fri", startTime: "09:00", endTime: "17:00" },
                                                ]);
                                            }
                                        }}
                                        className="text-xs font-bold underline hover:text-black/70"
                                    >
                                        Reset to Standard Hours
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
                                        const daySlots = scheduleDays.filter(s => s.dayOfWeek === day);
                                        const isEnabled = daySlots.length > 0;

                                        return (
                                            <div key={day} className="flex flex-col sm:flex-row sm:items-start gap-4 py-2 border-b border-dashed border-gray-200 last:border-0">
                                                {/* Toggle + Label */}
                                                <div className="w-32 flex items-center gap-3 pt-2">
                                                    <button
                                                        onClick={() => handleToggleDay(day, !isEnabled)}
                                                        className={cn("w-10 h-6 rounded-full border-2 border-black relative transition-colors", isEnabled ? "bg-black" : "bg-gray-200")}
                                                    >
                                                        <div className={cn("size-4 rounded-full border-2 border-black bg-white absolute top-0.5 transition-all", isEnabled ? "left-4" : "left-0.5")} />
                                                    </button>
                                                    <span className="font-bold uppercase text-sm">{day}</span>
                                                </div>

                                                {/* Slots */}
                                                <div className="flex-1 space-y-2">
                                                    {isEnabled ? (
                                                        <>
                                                            {daySlots.map((slot, idx) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <input
                                                                            type="time"
                                                                            value={slot.startTime}
                                                                            onChange={(e) => handleUpdateSlot(day, idx, 'startTime', e.target.value)}
                                                                            className="px-2 py-1 border-2 border-black font-bold text-sm bg-white w-28"
                                                                        />
                                                                        <span className="font-bold">-</span>
                                                                        <input
                                                                            type="time"
                                                                            value={slot.endTime}
                                                                            onChange={(e) => handleUpdateSlot(day, idx, 'endTime', e.target.value)}
                                                                            className="px-2 py-1 border-2 border-black font-bold text-sm bg-white w-28"
                                                                        />
                                                                    </div>
                                                                    <button onClick={() => handleRemoveSlot(day, idx)} className="p-1 hover:bg-red-100 text-red-500 rounded transition-colors">
                                                                        <Trash2 className="size-4" />
                                                                    </button>
                                                                    {idx === daySlots.length - 1 && (
                                                                        <button onClick={() => handleAddSlot(day)} className="p-1 hover:bg-gray-100 rounded transition-colors" title="Add another slot">
                                                                            <Plus className="size-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </>
                                                    ) : (
                                                        <div className="pt-2 text-sm text-muted-foreground font-medium italic">Unavailable</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {isScheduleDirty && (
                                    <div className="flex justify-end pt-4 animate-in fade-in slide-in-from-bottom-2">
                                        <button
                                            onClick={handleSaveSchedule}
                                            disabled={isSaving}
                                            className="bg-black text-white px-6 py-2 border-2 border-black font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all disabled:opacity-50"
                                        >
                                            {isSaving ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Overrides */}
                            <div className="space-y-6 pt-6 border-t-2 border-black/10">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase">Date-Specific Hours</h3>
                                    <button
                                        onClick={() => {
                                            setEditingOverrideId(null); // Ensure we're creating a new one
                                            setSelectedDates([]);
                                            setOverrideForm({ dates: [], isUnavailable: false, startTime: "09:00", endTime: "17:00" });
                                            setIsOverrideModalOpen(true);
                                        }}
                                        className="bg-white text-black px-4 py-2 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2"
                                    >
                                        <Plus className="size-4" /> Add Custom Date
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {overrides.length === 0 && (
                                        <p className="text-muted-foreground text-sm italic">No specific date overrides set.</p>
                                    )}
                                    {overrides.map((override) => (
                                        <div key={override.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <div>
                                                <div className="flex items-center gap-2 font-bold mb-1">
                                                    <Calendar className="size-4" />
                                                    <span>{override.date}</span>
                                                </div>
                                                <div className="text-sm">
                                                    {override.isUnavailable ? (
                                                        <span className="text-red-500 font-bold uppercase text-xs border border-red-500 px-1 rounded">Unavailable</span>
                                                    ) : (
                                                        <span>{formatTime(override.startTime)} - {formatTime(override.endTime)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 self-end sm:self-center">
                                                <button
                                                    onClick={() => handleEditOverride(override)}
                                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                    title="Edit Override"
                                                >
                                                    <Edit className="size-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteOverride(override.id)}
                                                    className="p-1 hover:bg-red-100 text-red-500 rounded transition-colors"
                                                    title="Delete Override"
                                                >
                                                    <Trash2 className="size-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Override Modal */}
                            {isOverrideModalOpen && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                    <div className="bg-white border-2 border-black p-6 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200">
                                        <h3 className="text-lg font-black uppercase mb-4">{editingOverrideId ? "Edit Custom Schedule" : "Add Custom Schedule"}</h3>

                                        <div className="space-y-6">
                                            {/* DayPicker with Neo-Brutalist Styles */}
                                            <div className="flex flex-col items-center w-full ">
                                                <div className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                                    <DayPicker
                                                        mode="multiple"
                                                        max={editingOverrideId ? 1 : undefined}
                                                        selected={selectedDates}
                                                        onSelect={setSelectedDates}
                                                        classNames={{
                                                            chevron: "fill-black",
                                                            day: "p-1",
                                                        }}
                                                        disabled={{ before: new Date() }}
                                                        modifiersClassNames={{
                                                            disabled: "bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed",
                                                            selected: "bg-primary text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold rounded-none hover:bg-primary hover:text-black focus:bg-primary focus:text-black active:bg-primary active:text-black",
                                                            today: "font-black underline decoration-2 underline-offset-4 decoration-black",
                                                        }}
                                                    />
                                                </div>
                                            </div>



                                            {/* Time Inputs */}
                                            {!overrideForm.isUnavailable && (
                                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase mb-1">Start Time</label>
                                                        <input
                                                            type="time"
                                                            value={overrideForm.startTime}
                                                            onChange={(e) => setOverrideForm({ ...overrideForm, startTime: e.target.value })}
                                                            className="w-full px-3 py-2 border-2 border-black font-bold h-12 bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold uppercase mb-1">End Time</label>
                                                        <input
                                                            type="time"
                                                            value={overrideForm.endTime}
                                                            onChange={(e) => setOverrideForm({ ...overrideForm, endTime: e.target.value })}
                                                            className="w-full px-3 py-2 border-2 border-black font-bold h-12 bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unavailable Toggle */}
                                            <div className="flex items-center justify-between py-4 border-t-2 border-black/10">
                                                <div className="flex items-center gap-3 w-full cursor-pointer group" onClick={() => setOverrideForm({ ...overrideForm, isUnavailable: !overrideForm.isUnavailable })}>
                                                    <div className={cn("w-12 h-7 rounded-full border-2 border-black relative transition-colors", overrideForm.isUnavailable ? "bg-black" : "bg-gray-200 group-hover:bg-gray-300")}>
                                                        <div className={cn("size-5 rounded-full border-2 border-black bg-white absolute top-0.5 transition-all", overrideForm.isUnavailable ? "left-5" : "left-0.5")} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-sm uppercase">Mark as Unavailable</span>
                                                        <span className="text-xs text-muted-foreground font-medium">Block bookings for these dates</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 mt-6 border-t-2 border-black/10 pt-4">
                                            <button
                                                onClick={() => {
                                                    setIsOverrideModalOpen(false);
                                                    setSelectedDates([]);
                                                    setEditingOverrideId(null);
                                                }}
                                                className="px-4 py-2 font-bold uppercase hover:bg-gray-100"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveOverride}
                                                disabled={isSaving || !selectedDates || selectedDates.length === 0}
                                                className="bg-black text-white px-6 py-2 border-2 border-black font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                            >
                                                Save Custom Date
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {
                        activeTab === 'services' && (
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
                        )
                    }
                </div >
            </div >

            {/* Service Modal */}
            {
                isServiceModalOpen && (
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
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deleteModal.isOpen && (
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
                )
            }

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </DashboardLayout >
    );
}
