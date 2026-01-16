import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { Palette, Eye, Link2, Check, Package, Plus, Edit, Trash2, ArrowRight, User as UserIcon, ChevronDown, Search, Camera, Loader2, Clock, Copy, Calendar, Globe, Phone, Mail, Instagram, Facebook, X, Type, Square, Circle, Layout, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useQuery, useAction } from "wasp/client/operations";
import { useAuth } from "wasp/client/auth";
import { getBusinessByUser, getServicesByBusinessAndUserId, upsertBusiness, updateUserProfile, createService, updateService, deleteService, createFileUploadUrl, addFileToDb, getDownloadFileSignedURL, updateUserProfileImage, getSchedule, updateSchedule, updateScheduleOverride } from "wasp/client/operations";
import { uploadFileWithProgress, validateFile } from "../../file-upload/fileUploading";
import { cn } from "../../client/utils";
import { ToastContainer, Toast } from "../../client/components/Toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format } from "date-fns";
import { StyleConfig, StyleTemplate, ButtonStyle, ButtonShape, FontFamily, parseStyleConfig, stringifyStyleConfig, TEMPLATE_DEFAULTS, FONT_CSS, getButtonStyles, getContainerStyles } from "../../shared/styleConfig";

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
    const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
    const [expandedSection, setExpandedSection] = useState<string | null>('templates');

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

    // Dirty Checking State
    const [initialProfileFormHash, setInitialProfileFormHash] = useState<string>("");
    const [initialStyleFormHash, setInitialStyleFormHash] = useState<string>("");

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

    // Style customization state using StyleConfig
    const [styleForm, setStyleForm] = useState<StyleConfig>(TEMPLATE_DEFAULTS.brutalist);

    // Update form when user data loads
    // Update form when user data loads
    useEffect(() => {
        if (user) {
            const newProfileForm = {
                username: user.username || "",
                slug: user.slug || "",
                bio: user.bio || "",
                openingTime: user.openingTime || "09:00",
                closingTime: user.closingTime || "17:00",
                workDays: user.workDays ? user.workDays.split(',') : ["mon", "tue", "wed", "thu", "fri"],
                timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                // Business fields
                phone: business?.phone || "",
                instagramUrl: business?.instagramUrl || "",
                isInstagramEnabled: !!business?.instagramUrl && (business?.isInstagramEnabled ?? false),
                tiktokUrl: business?.tiktokUrl || "",
                isTikTokEnabled: !!business?.tiktokUrl && (business?.isTikTokEnabled ?? false),
                facebookUrl: business?.facebookUrl || "",
                isFacebookEnabled: !!business?.facebookUrl && (business?.isFacebookEnabled ?? false),
                websiteUrl: business?.websiteUrl || "",
                isWebsiteEnabled: !!business?.websiteUrl && (business?.isWebsiteEnabled ?? false),
                contactEmail: business?.contactEmail || "",
                isContactEmailEnabled: !!business?.contactEmail && (business?.isContactEmailEnabled ?? false),
                isPhoneEnabled: business?.isPhoneEnabled ?? true
            };
            setProfileForm(newProfileForm);
            setInitialProfileFormHash(JSON.stringify(newProfileForm));
        }
    }, [user, business]);

    // Load styleConfig from user
    useEffect(() => {
        if (user) {
            const config = parseStyleConfig((user as any).styleConfig);
            setStyleForm(config);
            setInitialStyleFormHash(JSON.stringify(config));
        }
    }, [user]);

    // Check for unsaved changes
    const isDirty = useMemo(() => {
        if (!initialProfileFormHash || !initialStyleFormHash) return false;
        return JSON.stringify(profileForm) !== initialProfileFormHash || JSON.stringify(styleForm) !== initialStyleFormHash;
    }, [profileForm, styleForm, initialProfileFormHash, initialStyleFormHash]);

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

    const baseUrl = import.meta.env.WASP_WEB_CLIENT_URL || window.location.origin;
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



    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            // 1. Validation for User/Profile fields
            if (profileForm.isPhoneEnabled && !profileForm.phone.trim()) {
                addToast("Please enter a phone number or remove it.", "error");
                setIsSaving(false);
                return;
            }
            // ... (Other validations can remain same/similar, reusing logic best if refactored but for now duplicate strictly necessary checks)

            // 2. Update User Profile (Standard Fields)
            await updateUserProfileAction({
                username: profileForm.username,
                slug: profileForm.slug,
                bio: profileForm.bio,
                openingTime: profileForm.openingTime,
                closingTime: profileForm.closingTime,
                workDays: profileForm.workDays.join(','),
                styleConfig: stringifyStyleConfig(styleForm) // Include Style Config Here
            });

            // 3. Upsert Business Details
            await updateBusinessAction({
                name: business?.name || profileForm.username || "My Business",
                slug: profileForm.slug || user?.username || "business",
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

            addToast("All changes saved successfully!", 'success');

            // Update initial hashes to current state
            setInitialProfileFormHash(JSON.stringify(profileForm));
            setInitialStyleFormHash(JSON.stringify(styleForm));
        } catch (error: any) {
            console.error(error);
            addToast("Failed to save changes: " + error.message, 'error');
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
            <div className="w-full mx-auto pb-20">
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
                    </div>
                </div>



                {/* Header Actions */}
                <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
                    <h2 className="text-xl font-black uppercase flex items-center gap-2">
                        <Edit className="size-5" />
                        Page Editor
                    </h2>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 relative">
                    {/* Left Sidebar - Editor Sections */}
                    <div className="w-full lg:w-[420px] shrink-0">
                        <div className="space-y-4">
                            {/* 1. Profile Section */}
                            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-all">
                                <button
                                    onClick={() => setExpandedSection(expandedSection === 'profile' ? null : 'profile')}
                                    className="w-full flex items-center justify-between p-4 font-black text-sm uppercase bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <UserIcon className="size-5 shrink-0" />
                                        <span>Profile & Content</span>
                                    </div>
                                    <ChevronDown className={cn("size-4 transition-transform", expandedSection === 'profile' ? "rotate-180" : "")} />
                                </button>

                                {expandedSection === 'profile' && (
                                    <div className="p-5 border-t-2 border-black space-y-6 animate-in slide-in-from-top-2">
                                        {/* Profile Image */}
                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-3">Profile Photo</label>
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "relative group size-16 shrink-0 border-2 border-black overflow-hidden",
                                                    styleForm.profile?.imageShape === 'circle' ? "rounded-full" : styleForm.profile?.imageShape === 'rounded' ? "rounded-lg" : "rounded-none"
                                                )}>
                                                    {currentUserProfileImageUrl ? (
                                                        <img src={currentUserProfileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100"><UserIcon className="size-6 text-gray-400" /></div>
                                                    )}
                                                    <label htmlFor="profile-photo-upload-side" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                        <Camera className="size-5 text-white" />
                                                    </label>
                                                    <input id="profile-photo-upload-side" type="file" accept="image/*" onChange={handleProfilePhotoUpload} className="hidden" />
                                                </div>
                                                <div className="space-y-2.5 flex-1">
                                                    <div>
                                                        <label className="block text-[8px] font-bold uppercase text-gray-400 mb-1">Size</label>
                                                        <div className="grid grid-cols-3 gap-1">
                                                            {(['small', 'medium', 'large'] as const).map((size) => (
                                                                <button key={size} onClick={() => setStyleForm({ ...styleForm, profile: { ...styleForm.profile, imageSize: size } })} className={cn("px-1 py-1 text-[8px] font-bold uppercase border border-black transition-all", styleForm.profile?.imageSize === size ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50")}>{size}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[8px] font-bold uppercase text-gray-400 mb-1">Shape</label>
                                                        <div className="grid grid-cols-3 gap-1">
                                                            {(['circle', 'rounded', 'square'] as const).map((shape) => (
                                                                <button key={shape} onClick={() => setStyleForm({ ...styleForm, profile: { ...styleForm.profile, imageShape: shape } })} className={cn("h-7 flex items-center justify-center border border-black transition-all", styleForm.profile?.imageShape === shape ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50")}>
                                                                    <div className={cn("size-3 bg-current", shape === 'circle' ? 'rounded-full' : shape === 'rounded' ? 'rounded-[4px]' : 'rounded-none')} />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[8px] font-bold uppercase text-gray-400 mb-1">Border</label>
                                                        <div className="flex gap-1">
                                                            <div className="grid grid-cols-4 gap-1 flex-1">
                                                                {(['none', 'thin', 'medium', 'thick'] as const).map((width) => (
                                                                    <button key={width} onClick={() => setStyleForm({ ...styleForm, profile: { ...styleForm.profile, imageBorderWidth: width } })} className={cn("h-7 flex items-center justify-center border border-black transition-all", styleForm.profile?.imageBorderWidth === width ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50")}>
                                                                        <div className={cn("size-3 rounded-full border-current", width === 'none' ? 'border border-dashed opacity-50' : width === 'thin' ? 'border' : width === 'medium' ? 'border-2' : 'border-4')} />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <input type="color" value={styleForm.profile?.imageBorderColor || '#000000'} onChange={(e) => setStyleForm({ ...styleForm, profile: { ...styleForm.profile, imageBorderColor: e.target.value } })} className="size-7 border-2 border-black rounded cursor-pointer p-0 shrink-0" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="border-dashed border-gray-300" />

                                        {/* Basic Info */}
                                        {/* Basic Info */}
                                        <div className="space-y-6">
                                            {/* Display Name Section */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-xs font-bold text-muted-foreground uppercase">Display Name</label>
                                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                                        <span className="text-[10px] font-bold uppercase text-gray-400">Show</span>
                                                        <input type="checkbox" checked={styleForm.profile?.titleEnabled} onChange={() => setStyleForm({ ...styleForm, profile: { ...styleForm.profile, titleEnabled: !styleForm.profile?.titleEnabled } })} className="size-3 accent-black rounded-none border border-black" />
                                                    </label>
                                                </div>
                                                <input type="text" value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} className="w-full px-3 py-2 border-2 border-black text-sm font-bold mb-2" />

                                                {/* Heading Style Controls */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 flex bg-gray-100 p-1 border border-gray-200 rounded gap-1">
                                                        {(['small', 'medium', 'large', 'xl'] as const).map(s => (
                                                            <button key={s} onClick={() => setStyleForm({ ...styleForm, profile: { ...styleForm.profile, titleSize: s } })} className={cn("flex-1 py-1 text-[8px] font-bold uppercase rounded-sm transition-all", styleForm.profile?.titleSize === s ? "bg-white shadow-sm text-black scale-105 font-black" : "text-gray-400 hover:text-gray-600")}>{s === 'xl' ? 'XL' : s[0]}</button>
                                                        ))}
                                                    </div>
                                                    <div className="relative group">
                                                        <input type="color" value={styleForm.profile.titleColor} onChange={(e) => setStyleForm({ ...styleForm, profile: { ...styleForm.profile, titleColor: e.target.value } })} className="size-8 border-2 border-black rounded cursor-pointer p-0" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bio Section */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="text-xs font-bold text-muted-foreground uppercase">Bio</label>
                                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                                        <span className="text-[10px] font-bold uppercase text-gray-400">Show</span>
                                                        <input type="checkbox" checked={styleForm.profile?.subtitleEnabled} onChange={() => setStyleForm({ ...styleForm, profile: { ...styleForm.profile, subtitleEnabled: !styleForm.profile?.subtitleEnabled } })} className="size-3 accent-black rounded-none border border-black" />
                                                    </label>
                                                </div>
                                                <textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} className="w-full px-3 py-2 border-2 border-black text-sm font-bold resize-none h-20 mb-2" />

                                                {/* Bio Style Controls */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 flex bg-gray-100 p-1 border border-gray-200 rounded gap-1">
                                                        {(['small', 'medium', 'large'] as const).map(s => (
                                                            <button key={s} onClick={() => setStyleForm({ ...styleForm, profile: { ...styleForm.profile, bioSize: s } })} className={cn("flex-1 py-1 text-[8px] font-bold uppercase rounded-sm transition-all", styleForm.profile?.bioSize === s ? "bg-white shadow-sm text-black scale-105 font-black" : "text-gray-400 hover:text-gray-600")}>{s[0]}</button>
                                                        ))}
                                                    </div>
                                                    <div className="relative group">
                                                        <input type="color" value={styleForm.profile.bioColor} onChange={(e) => setStyleForm({ ...styleForm, profile: { ...styleForm.profile, bioColor: e.target.value } })} className="size-8 border-2 border-black rounded cursor-pointer p-0" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Handle (URL)</label>
                                                <div className="flex bg-gray-100 border-2 border-black items-center px-3">
                                                    <span className="text-xs font-bold text-gray-500 whitespace-nowrap">/book/</span>
                                                    <input type="text" value={profileForm.slug} onChange={(e) => setProfileForm({ ...profileForm, slug: e.target.value })} className="w-full pl-1 py-2 bg-transparent text-sm font-bold outline-none" />
                                                </div>
                                            </div>
                                        </div>



                                    </div>
                                )}
                            </div>

                            {/* Social Links Section */}
                            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-all">
                                <button
                                    onClick={() => setExpandedSection(expandedSection === 'socials' ? null : 'socials')}
                                    className="w-full flex items-center justify-between p-4 font-black text-sm uppercase bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Link2 className="size-5 shrink-0" />
                                        <span>Social Links</span>
                                    </div>
                                    <ChevronDown className={cn("size-4 transition-transform", expandedSection === 'socials' ? "rotate-180" : "")} />
                                </button>
                                {expandedSection === 'socials' && (
                                    <div className="p-5 border-t-2 border-black space-y-6 animate-in slide-in-from-top-2">

                                        {/* Social Button Styling */}
                                        <div className="bg-gray-50 border border-gray-200 p-3 rounded">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-[10px] font-bold uppercase text-gray-500">Social Buttons Style</label>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[8px] font-bold uppercase mb-1">Background</label>
                                                    <div className="flex items-center gap-2">
                                                        <input type="color" value={styleForm.socialButton?.color || styleForm.button.color} onChange={(e) => setStyleForm({ ...styleForm, socialButton: { ...styleForm.socialButton, color: e.target.value } })} className="w-full h-8 border border-black p-0 cursor-pointer" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[8px] font-bold uppercase mb-1">Icon Color</label>
                                                    <div className="flex items-center gap-2">
                                                        <input type="color" value={styleForm.socialButton?.textColor || styleForm.button.textColor} onChange={(e) => setStyleForm({ ...styleForm, socialButton: { ...styleForm.socialButton, textColor: e.target.value } })} className="w-full h-8 border border-black p-0 cursor-pointer" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact & Socials Toggle Grid */}
                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-3">Links & Contacts</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { key: 'isPhoneEnabled', icon: Phone, label: 'Phone', val: profileForm.phone, setter: (v: string) => setProfileForm({ ...profileForm, phone: v }) },
                                                    { key: 'isContactEmailEnabled', icon: Mail, label: 'Email', val: profileForm.contactEmail, setter: (v: string) => setProfileForm({ ...profileForm, contactEmail: v }) },
                                                    { key: 'isWebsiteEnabled', icon: Globe, label: 'Website', val: profileForm.websiteUrl, setter: (v: string) => setProfileForm({ ...profileForm, websiteUrl: v }) },
                                                    { key: 'isInstagramEnabled', icon: Instagram, label: 'Instagram', val: profileForm.instagramUrl, setter: (v: string) => setProfileForm({ ...profileForm, instagramUrl: v }) },
                                                    { key: 'isTikTokEnabled', icon: null, label: 'TikTok', val: profileForm.tiktokUrl, setter: (v: string) => setProfileForm({ ...profileForm, tiktokUrl: v }), customIcon: <div className="size-3 border border-current rounded-full flex items-center justify-center text-[6px] font-black">TT</div> },
                                                    { key: 'isFacebookEnabled', icon: Facebook, label: 'Facebook', val: profileForm.facebookUrl, setter: (v: string) => setProfileForm({ ...profileForm, facebookUrl: v }) },
                                                ].map((item: any) => (
                                                    <div key={item.label} className="col-span-1">
                                                        <button
                                                            onClick={(e) => { e.preventDefault(); setProfileForm({ ...profileForm, [item.key]: !(profileForm as any)[item.key] }); }}
                                                            className={cn("w-full flex items-center gap-2 px-3 py-2 border-2 text-[10px] uppercase font-bold transition-all", (profileForm as any)[item.key] ? "bg-black/5 border-black text-black" : "border-gray-200 text-gray-400")}
                                                        >
                                                            {item.icon ? <item.icon className="size-3" /> : item.customIcon}
                                                            {item.label}
                                                        </button>
                                                        {(profileForm as any)[item.key] && (
                                                            <input
                                                                type="text"
                                                                value={item.val}
                                                                onChange={(e) => item.setter(e.target.value)}
                                                                placeholder={`Enter ${item.label}...`}
                                                                className="w-full mt-1 px-2 py-1.5 border-2 border-black text-xs font-bold bg-white"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Social Position */}
                                            <div className="mt-4 flex items-center justify-between bg-gray-50 border border-gray-200 p-2 rounded">
                                                <span className="text-[10px] font-bold uppercase text-gray-500">Socials Position</span>
                                                <div className="flex bg-white border border-gray-300 rounded p-0.5">
                                                    <button onClick={() => setStyleForm({ ...styleForm, profile: { ...styleForm.profile, socialPosition: 'top' } })} className={cn("px-2 py-1 text-[10px] font-bold uppercase rounded-sm", styleForm.profile?.socialPosition === 'top' ? "bg-gray-200" : "")}>Top</button>
                                                    <button onClick={() => setStyleForm({ ...styleForm, profile: { ...styleForm.profile, socialPosition: 'bottom' } })} className={cn("px-2 py-1 text-[10px] font-bold uppercase rounded-sm", styleForm.profile?.socialPosition === 'bottom' ? "bg-gray-200" : "")}>Bottom</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 2. Templates Section */}
                            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-all">
                                <button
                                    onClick={() => setExpandedSection(expandedSection === 'templates' ? null : 'templates')}
                                    className="w-full flex items-center justify-between p-4 font-black text-sm uppercase bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Palette className="size-5 shrink-0" />
                                        <span>Templates</span>
                                    </div>
                                    <ChevronDown className={cn("size-4 transition-transform", expandedSection === 'templates' ? "rotate-180" : "")} />
                                </button>
                                {expandedSection === 'templates' && (
                                    <div className="p-5 border-t-2 border-black grid grid-cols-2 gap-2 animate-in slide-in-from-top-2">
                                        {(Object.keys(TEMPLATE_DEFAULTS) as StyleTemplate[]).map((template) => (
                                            <button
                                                key={template}
                                                onClick={() => setStyleForm({ ...TEMPLATE_DEFAULTS[template], template })}
                                                className={cn(
                                                    "p-3 border-2 font-bold uppercase text-[10px] transition-all text-center rounded hover:scale-[1.02]",
                                                    styleForm.template === template
                                                        ? "border-black bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                                                        : "border-gray-200 text-gray-500 hover:border-black hover:text-black"
                                                )}
                                            >
                                                {template.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 3. Appearance (Background & Typography) */}
                            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-all">
                                <button
                                    onClick={() => setExpandedSection(expandedSection === 'appearance' ? null : 'appearance')}
                                    className="w-full flex items-center justify-between p-4 font-black text-sm uppercase bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Type className="size-5 shrink-0" />
                                        <span>Appearance</span>
                                    </div>
                                    <ChevronDown className={cn("size-4 transition-transform", expandedSection === 'appearance' ? "rotate-180" : "")} />
                                </button>
                                {expandedSection === 'appearance' && (
                                    <div className="p-5 border-t-2 border-black space-y-6 animate-in slide-in-from-top-2">
                                        {/* Background */}
                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Background</label>
                                            <div className="flex gap-2 mb-3">
                                                <button onClick={() => setStyleForm({ ...styleForm, background: { ...styleForm.background, type: 'solid' } })} className={cn("flex-1 p-2 border-2 text-[10px] font-bold uppercase", styleForm.background.type === 'solid' ? "border-black bg-gray-100" : "border-gray-200 text-gray-400")}>Solid</button>
                                                <button onClick={() => setStyleForm({ ...styleForm, background: { ...styleForm.background, type: 'gradient', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } })} className={cn("flex-1 p-2 border-2 text-[10px] font-bold uppercase", styleForm.background.type === 'gradient' ? "border-black bg-gray-100" : "border-gray-200 text-gray-400")}>Gradient</button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={styleForm.background.color} onChange={(e) => setStyleForm({ ...styleForm, background: { ...styleForm.background, color: e.target.value } })} className="size-8 border-2 border-black p-0 cursor-pointer" />
                                                <input type="text" value={styleForm.background.color} onChange={(e) => setStyleForm({ ...styleForm, background: { ...styleForm.background, color: e.target.value } })} className="flex-1 px-3 py-1.5 border-2 border-black text-xs font-mono font-bold uppercase" />
                                            </div>
                                        </div>

                                        <hr className="border-dashed border-gray-300" />

                                        {/* Typography */}
                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Typography</label>
                                            <select
                                                value={styleForm.font.family}
                                                onChange={(e) => setStyleForm({ ...styleForm, font: { ...styleForm.font, family: e.target.value as FontFamily } })}
                                                className="w-full px-3 py-2 border-2 border-black text-xs font-bold mb-3"
                                            >
                                                <option value="inter">Inter (Modern)</option>
                                                <option value="manrope">Manrope (Clean)</option>
                                                <option value="instrument-serif">Instrument Serif (Elegant)</option>
                                                <option value="dm-sans">DM Sans (Minimal)</option>
                                                <option value="bricolage">Bricolage (Trendy)</option>
                                                <option value="syne">Syne (Bold)</option>
                                                <option value="outfit">Outfit (Premium)</option>
                                                <option value="space-grotesk">Space Grotesk (Tech)</option>
                                                <option value="poppins">Poppins (Soft)</option>
                                                <option value="playfair">Playfair Display (Classy)</option>
                                                <option value="roboto">Roboto (Standard)</option>
                                            </select>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={styleForm.font.color} onChange={(e) => setStyleForm({ ...styleForm, font: { ...styleForm.font, color: e.target.value } })} className="size-8 border-2 border-black p-0 cursor-pointer" />
                                                <input type="text" value={styleForm.font.color} onChange={(e) => setStyleForm({ ...styleForm, font: { ...styleForm.font, color: e.target.value } })} className="flex-1 px-3 py-1.5 border-2 border-black text-xs font-mono font-bold uppercase" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 4. Buttons Section */}
                            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden transition-all">
                                <button
                                    onClick={() => setExpandedSection(expandedSection === 'buttons' ? null : 'buttons')}
                                    className="w-full flex items-center justify-between p-4 font-black text-sm uppercase bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Square className="size-5 shrink-0" />
                                        <span>Services</span>
                                    </div>
                                    <ChevronDown className={cn("size-4 transition-transform", expandedSection === 'buttons' ? "rotate-180" : "")} />
                                </button>
                                {expandedSection === 'buttons' && (
                                    <div className="p-5 border-t-2 border-black space-y-5 animate-in slide-in-from-top-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Color</label>
                                                <input type="color" value={styleForm.button.color} onChange={(e) => setStyleForm({ ...styleForm, button: { ...styleForm.button, color: e.target.value } })} className="w-full h-8 border-2 border-black p-0 cursor-pointer" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Text</label>
                                                <input type="color" value={styleForm.button.textColor} onChange={(e) => setStyleForm({ ...styleForm, button: { ...styleForm.button, textColor: e.target.value } })} className="w-full h-8 border-2 border-black p-0 cursor-pointer" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Style</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(['fill', 'outline', 'soft-shadow', 'hard-shadow'] as ButtonStyle[]).map((style) => (
                                                    <button key={style} onClick={() => setStyleForm({ ...styleForm, button: { ...styleForm.button, style } })} className={cn("p-2 border-2 text-[10px] font-bold uppercase", styleForm.button.style === style ? "border-black bg-gray-100" : "border-gray-200 text-gray-400")}>{style}</button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Shape</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['square', 'rounded', 'pill'] as ButtonShape[]).map((shape) => (
                                                    <button key={shape} onClick={() => setStyleForm({ ...styleForm, button: { ...styleForm.button, shape } })} className={cn("p-2 border-2 text-[10px] font-bold uppercase", styleForm.button.shape === shape ? "border-black bg-gray-100" : "border-gray-200 text-gray-400")}>{shape}</button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t-2 border-gray-100">
                                            <label className="flex items-center gap-2 mb-3 cursor-pointer">
                                                <input type="checkbox" checked={styleForm.serviceButton?.enabled} onChange={() => setStyleForm({ ...styleForm, serviceButton: { ...styleForm.serviceButton, enabled: !styleForm.serviceButton?.enabled } })} className="size-4 rounded-none border-2 border-black accent-black" />
                                                <span className="text-xs font-bold uppercase">"Book" Button</span>
                                            </label>
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    disabled={!styleForm.serviceButton?.enabled}
                                                    value={styleForm.serviceButton?.text || "Book"}
                                                    onChange={(e) => setStyleForm({ ...styleForm, serviceButton: { ...styleForm.serviceButton, text: e.target.value } })}
                                                    className="w-full px-3 py-2 border-2 border-black text-xs font-bold uppercase disabled:opacity-50"
                                                    placeholder="Button Text"
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[8px] font-bold uppercase mb-1 text-gray-400">Background</label>
                                                        <input type="color" value={styleForm.serviceButton?.color || styleForm.button.color} onChange={(e) => setStyleForm({ ...styleForm, serviceButton: { ...styleForm.serviceButton, color: e.target.value } })} className="w-full h-8 border-2 border-black p-0 cursor-pointer disabled:opacity-50" disabled={!styleForm.serviceButton?.enabled} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[8px] font-bold uppercase mb-1 text-gray-400">Text Color</label>
                                                        <input type="color" value={styleForm.serviceButton?.textColor || styleForm.button.textColor} onChange={(e) => setStyleForm({ ...styleForm, serviceButton: { ...styleForm.serviceButton, textColor: e.target.value } })} className="w-full h-8 border-2 border-black p-0 cursor-pointer disabled:opacity-50" disabled={!styleForm.serviceButton?.enabled} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Live Preview */}
                    <div className="flex-1 min-w-0 transition-all">
                        <div className="sticky top-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-sm font-black uppercase text-gray-400">Live Preview</h3>
                                    {/* Desktop/Mobile Toggle */}
                                    <div className="flex bg-gray-100 p-1 border-2 border-black">
                                        <button
                                            onClick={() => setPreviewMode('mobile')}
                                            className={cn(
                                                "px-3 py-1.5 text-[10px] font-bold uppercase transition-all flex items-center gap-1",
                                                previewMode === 'mobile' ? "bg-black text-white" : "text-gray-500 hover:text-black"
                                            )}
                                        >
                                            <Phone className="size-3" />
                                            Mobile
                                        </button>
                                        <button
                                            onClick={() => setPreviewMode('desktop')}
                                            className={cn(
                                                "px-3 py-1.5 text-[10px] font-bold uppercase transition-all flex items-center gap-1",
                                                previewMode === 'desktop' ? "bg-black text-white" : "text-gray-500 hover:text-black"
                                            )}
                                        >
                                            <Layout className="size-3" />
                                            Desktop
                                        </button>
                                    </div>

                                    {isDirty && (
                                        <button
                                            onClick={handleSaveAll}
                                            disabled={isSaving}
                                            className="bg-black text-white px-4 py-1.5 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-1.5 animate-in fade-in zoom-in duration-200"
                                        >
                                            <Save className="size-3" />
                                            {isSaving ? "Saving..." : "Save Changes"}
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => bookingUrl && window.open(bookingUrl, '_blank')}
                                    className="text-[10px] font-bold uppercase flex items-center gap-1 text-gray-400 hover:text-black transition-colors"
                                >
                                    Open New Tab <ArrowRight className="size-3" />
                                </button>
                            </div>

                            {/* DEVICE FRAME - Mobile */}
                            {previewMode === 'mobile' && (
                                <div className="bg-gray-100 border-[3px] border-black rounded-[2rem] p-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] relative max-w-sm mx-auto">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20"></div>
                                    <div className="bg-white rounded-[1.5rem] overflow-hidden border border-gray-200 h-[650px] relative no-scrollbar">
                                        {/* MOCK BOOKING PAGE RENDER */}
                                        {/* Mock Booking Page Preview */}
                                        <div
                                            className="w-full h-full relative bg-white"
                                            style={{
                                                background: styleForm.background.type === 'gradient' && styleForm.background.gradient
                                                    ? styleForm.background.gradient
                                                    : styleForm.background.color,
                                                fontFamily: FONT_CSS[styleForm.font.family].name
                                            }}
                                        >
                                            <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                                                <div className="p-8 max-w-lg mx-auto min-h-full flex flex-col items-center text-center">
                                                    {/* Profile Header */}
                                                    <div className="relative mb-6">
                                                        <div
                                                            className={cn(
                                                                "overflow-hidden bg-white relative z-10 mx-auto transition-all",
                                                                // Size
                                                                styleForm.profile?.imageSize === 'small' ? "size-28" :
                                                                    styleForm.profile?.imageSize === 'large' ? "size-56" : "size-40",
                                                                // Shape
                                                                styleForm.profile?.imageShape === 'square' ? "rounded-none" :
                                                                    styleForm.profile?.imageShape === 'rounded' ? "rounded-3xl" : "rounded-full",
                                                                // Border
                                                                styleForm.profile?.imageBorderWidth === 'none' ? "border-0" :
                                                                    styleForm.profile?.imageBorderWidth === 'thin' ? "border-2" :
                                                                        styleForm.profile?.imageBorderWidth === 'thick' ? "border-8" : "border-4"
                                                            )}
                                                            style={{ borderColor: styleForm.profile?.imageBorderColor || styleForm.font.color }}
                                                        >
                                                            {currentUserProfileImageUrl ? (
                                                                <img src={currentUserProfileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                                    <UserIcon className="size-10 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {styleForm.profile?.titleEnabled !== false && (
                                                        <h1
                                                            className={cn(
                                                                "font-black mb-2 transition-all",
                                                                styleForm.profile?.titleSize === 'small' ? "text-xl" :
                                                                    styleForm.profile?.titleSize === 'medium' ? "text-3xl" :
                                                                        styleForm.profile?.titleSize === 'large' ? "text-5xl" :
                                                                            styleForm.profile?.titleSize === 'xl' ? "text-7xl" : "text-3xl"
                                                            )}
                                                            style={{ color: styleForm.profile.titleColor }}
                                                        >
                                                            {profileForm.username || "Your Name"}
                                                        </h1>
                                                    )}
                                                    {styleForm.profile?.subtitleEnabled !== false && (
                                                        <p
                                                            className={cn(
                                                                "font-medium mb-6 max-w-sm mx-auto transition-all",
                                                                styleForm.profile?.bioSize === 'small' ? "text-xs" :
                                                                    styleForm.profile?.bioSize === 'large' ? "text-lg" : "text-sm"
                                                            )}
                                                            style={{ color: styleForm.profile.bioColor }}
                                                        >
                                                            {profileForm.bio || user?.bio || "Your bio will appear here..."}
                                                        </p>
                                                    )}

                                                    {/* Social Icons (Top) */}
                                                    {styleForm.profile?.socialEnabled !== false && styleForm.profile?.socialPosition !== 'bottom' && (
                                                        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                                                            {profileForm.instagramUrl && profileForm.isInstagramEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles(styleForm.button)}>
                                                                    <Instagram className="size-4" style={{ color: styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.tiktokUrl && profileForm.isTikTokEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles(styleForm.button)}>
                                                                    <div className="size-4 flex items-center justify-center font-black text-[8px]" style={{ color: styleForm.button.textColor }}>TT</div>
                                                                </div>
                                                            )}
                                                            {profileForm.facebookUrl && profileForm.isFacebookEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles(styleForm.button)}>
                                                                    <Facebook className="size-4" style={{ color: styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.websiteUrl && profileForm.isWebsiteEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles(styleForm.button)}>
                                                                    <Globe className="size-4" style={{ color: styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.phone && profileForm.isPhoneEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles(styleForm.button)}>
                                                                    <Phone className="size-4" style={{ color: styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.contactEmail && profileForm.isContactEmailEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles(styleForm.button)}>
                                                                    <Mail className="size-4" style={{ color: styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Mock Services */}
                                                    <div className="w-full space-y-3 text-left">
                                                        {(services && services.length > 0 ? services : [1, 2]).map((item: any) => {
                                                            const isMock = typeof item === 'number';
                                                            const name = isMock ? `Example Service ${item}` : item.name;
                                                            const description = isMock ? '30 mins • $50' : `${item.duration} mins • $${item.price}`;

                                                            return (
                                                                <div
                                                                    key={isMock ? item : item.id}
                                                                    className="p-4 transition-all cursor-pointer"
                                                                    style={{
                                                                        ...getContainerStyles(styleForm),
                                                                    }}
                                                                >
                                                                    <div className="flex justify-between items-center gap-4">
                                                                        <div style={{ color: styleForm.font.color }}>
                                                                            <div className="font-bold text-sm">{name}</div>
                                                                            <div className="text-xs opacity-70 mt-1">{description}</div>
                                                                        </div>
                                                                        {styleForm.serviceButton?.enabled ? (
                                                                            <div
                                                                                className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                                                                                style={{
                                                                                    backgroundColor: styleForm.serviceButton.color || styleForm.button.color,
                                                                                    color: styleForm.serviceButton.textColor || styleForm.button.textColor,
                                                                                    borderRadius: styleForm.button.shape === 'pill' ? '999px' : styleForm.button.shape === 'rounded' ? '6px' : '0px',
                                                                                }}
                                                                            >
                                                                                {styleForm.serviceButton.text}
                                                                            </div>
                                                                        ) : (
                                                                            <ArrowRight className="size-4" style={{ color: styleForm.font.color }} />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Social Links (Bottom) */}
                                                    {styleForm.profile?.socialEnabled !== false && styleForm.profile?.socialPosition === 'bottom' && (
                                                        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                                                            {profileForm.instagramUrl && profileForm.isInstagramEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <Instagram className="size-4" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.tiktokUrl && profileForm.isTikTokEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <div className="size-4 flex items-center justify-center font-black text-[8px]" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }}>TT</div>
                                                                </div>
                                                            )}
                                                            {profileForm.facebookUrl && profileForm.isFacebookEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <Facebook className="size-4" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.websiteUrl && profileForm.isWebsiteEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <Globe className="size-4" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.phone && profileForm.isPhoneEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <Phone className="size-4" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.contactEmail && profileForm.isContactEmailEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <Mail className="size-4" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* DEVICE FRAME - Desktop */}
                            {previewMode === 'desktop' && (
                                <div className="bg-gray-100 border-[3px] border-black rounded-xl p-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] relative w-full">
                                    <div className="flex items-center gap-2 mb-2 px-2">
                                        <div className="size-3 rounded-full bg-red-400 border border-black/20"></div>
                                        <div className="size-3 rounded-full bg-yellow-400 border border-black/20"></div>
                                        <div className="size-3 rounded-full bg-green-400 border border-black/20"></div>
                                        <div className="flex-1 bg-white rounded-full px-4 py-1 text-[10px] font-mono text-gray-400 border border-gray-200 ml-2 truncate">
                                            {bookingUrl || 'schedulemax.com/book/your-name'}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 h-[800px] relative">
                                        <div
                                            className="w-full h-full relative"
                                            style={{
                                                background: styleForm.background.type === 'gradient' && styleForm.background.gradient
                                                    ? styleForm.background.gradient
                                                    : styleForm.background.color,
                                                fontFamily: FONT_CSS[styleForm.font.family].name
                                            }}
                                        >
                                            <div className="absolute inset-0 overflow-y-auto">
                                                <div className="p-12 max-w-2xl mx-auto min-h-full flex flex-col items-center text-center">
                                                    {/* Profile Header */}
                                                    <div className="relative mb-8">
                                                        <div
                                                            className={cn(
                                                                "overflow-hidden bg-white relative z-10 mx-auto transition-all",
                                                                styleForm.profile?.imageSize === 'small' ? "size-32" :
                                                                    styleForm.profile?.imageSize === 'large' ? "size-64" : "size-48",
                                                                styleForm.profile?.imageShape === 'square' ? "rounded-none" :
                                                                    styleForm.profile?.imageShape === 'rounded' ? "rounded-3xl" : "rounded-full",
                                                                styleForm.profile?.imageBorderWidth === 'none' ? "border-0" :
                                                                    styleForm.profile?.imageBorderWidth === 'thin' ? "border-2" :
                                                                        styleForm.profile?.imageBorderWidth === 'thick' ? "border-8" : "border-4"
                                                            )}
                                                            style={{ borderColor: styleForm.profile?.imageBorderColor || styleForm.font.color }}
                                                        >
                                                            {currentUserProfileImageUrl ? (
                                                                <img src={currentUserProfileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                                    <UserIcon className="size-16 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {styleForm.profile?.titleEnabled !== false && (
                                                        <h1
                                                            className={cn(
                                                                "font-black mb-3 transition-all",
                                                                styleForm.profile?.titleSize === 'small' ? "text-xl" :
                                                                    styleForm.profile?.titleSize === 'medium' ? "text-3xl" :
                                                                        styleForm.profile?.titleSize === 'large' ? "text-5xl" :
                                                                            styleForm.profile?.titleSize === 'xl' ? "text-7xl" : "text-4xl"
                                                            )}
                                                            style={{ color: styleForm.profile.titleColor }}
                                                        >
                                                            {profileForm.username || "Your Name"}
                                                        </h1>
                                                    )}
                                                    {styleForm.profile?.subtitleEnabled !== false && (
                                                        <p
                                                            className={cn(
                                                                "font-medium mb-8 max-w-md mx-auto transition-all",
                                                                styleForm.profile?.bioSize === 'small' ? "text-xs" :
                                                                    styleForm.profile?.bioSize === 'large' ? "text-lg" : "text-base"
                                                            )}
                                                            style={{ color: styleForm.profile.bioColor }}
                                                        >
                                                            {profileForm.bio || user?.bio || "Your bio will appear here..."}
                                                        </p>
                                                    )}

                                                    {/* Social Icons (Top - Desktop) */}
                                                    {styleForm.profile?.socialEnabled !== false && styleForm.profile?.socialPosition !== 'bottom' && (
                                                        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                                                            {profileForm.instagramUrl && profileForm.isInstagramEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <Instagram className="size-4" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.tiktokUrl && profileForm.isTikTokEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <div className="size-4 flex items-center justify-center font-black text-[8px]" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }}>TT</div>
                                                                </div>
                                                            )}
                                                            {profileForm.facebookUrl && profileForm.isFacebookEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <Facebook className="size-4" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.websiteUrl && profileForm.isWebsiteEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <Globe className="size-4" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.phone && profileForm.isPhoneEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <Phone className="size-4" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.contactEmail && profileForm.isContactEmailEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <Mail className="size-4" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Mock Services - Desktop */}
                                                    <div className="w-full max-w-lg space-y-4 text-left">
                                                        {(services && services.length > 0 ? services : [1, 2, 3]).map((item: any) => {
                                                            const isMock = typeof item === 'number';
                                                            const name = isMock ? `Example Service ${item}` : item.name;
                                                            const description = isMock ? '30 mins • $50' : `${item.duration} mins • $${item.price}`;

                                                            return (
                                                                <div
                                                                    key={isMock ? item : item.id}
                                                                    className="p-5 transition-all cursor-pointer"
                                                                    style={getContainerStyles(styleForm)}
                                                                >
                                                                    <div className="flex justify-between items-center gap-6">
                                                                        <div style={{ color: styleForm.font.color }}>
                                                                            <div className="font-bold text-base">{name}</div>
                                                                            <div className="text-sm opacity-70 mt-1">{description}</div>
                                                                        </div>
                                                                        {styleForm.serviceButton?.enabled ? (
                                                                            <div
                                                                                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                                                                                style={{
                                                                                    backgroundColor: styleForm.serviceButton.color || styleForm.button.color,
                                                                                    color: styleForm.serviceButton.textColor || styleForm.button.textColor,
                                                                                    borderRadius: styleForm.button.shape === 'pill' ? '999px' : styleForm.button.shape === 'rounded' ? '8px' : '0px',
                                                                                }}
                                                                            >
                                                                                {styleForm.serviceButton.text}
                                                                            </div>
                                                                        ) : (
                                                                            <ArrowRight className="size-5" style={{ color: styleForm.font.color }} />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Social Icons (Bottom - Desktop) */}
                                                    {styleForm.profile?.socialEnabled !== false && styleForm.profile?.socialPosition === 'bottom' && (
                                                        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                                                            {profileForm.instagramUrl && profileForm.isInstagramEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <Instagram className="size-4" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.tiktokUrl && profileForm.isTikTokEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <div className="size-4 flex items-center justify-center font-black text-[8px]" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }}>TT</div>
                                                                </div>
                                                            )}
                                                            {profileForm.facebookUrl && profileForm.isFacebookEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <Facebook className="size-4" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.websiteUrl && profileForm.isWebsiteEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <Globe className="size-4" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.phone && profileForm.isPhoneEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <Phone className="size-4" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                            {profileForm.contactEmail && profileForm.isContactEmailEnabled && (
                                                                <div className="p-2 bg-white/90 backdrop-blur rounded-full transition-all"
                                                                    style={getButtonStyles({ ...styleForm.button, ...(styleForm.socialButton || {}) })}>
                                                                    <Mail className="size-4" style={{ color: styleForm.socialButton?.textColor || styleForm.button.textColor }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground">
                                <Globe className="size-3" />
                                {previewMode === 'mobile' ? 'Mobile Preview' : 'Desktop Preview'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </DashboardLayout>
    );
}
