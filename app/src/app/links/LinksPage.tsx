import { useState, useEffect } from "react";
import { useQuery, getBusinessByUser, upsertBusiness, createService, updateService, deleteService } from "wasp/client/operations";
import DashboardLayout from "../layout/DashboardLayout";
import { Button } from "../../client/components/ui/button";
import { Input } from "../../client/components/ui/input";
import { Label } from "../../client/components/ui/label";
import { Textarea } from "../../client/components/ui/textarea";
import { Plus, Trash2, ExternalLink, Save, Edit2, X } from "lucide-react";
import { cn } from "../../client/utils";

export default function LinksPage() {
    const { data: shop, isLoading, refetch } = useQuery(getBusinessByUser);

    const [shopForm, setShopForm] = useState({
        name: "",
        slug: "",
        imageUrl: "",
        logoUrl: "",
        phone: "",
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; serviceId: string | null; serviceName: string }>({
        isOpen: false,
        serviceId: null,
        serviceName: ""
    });

    // Service form state
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
    const [serviceForm, setServiceForm] = useState({
        name: "",
        description: "",
        duration: 60,
        price: 0,
    });

    useEffect(() => {
        if (shop) {
            setShopForm({
                name: shop.name || "",
                slug: shop.slug || "",
                imageUrl: shop.imageUrl || "",
                logoUrl: shop.logoUrl || "",
                phone: shop.phone || "",
            });
        }
    }, [shop]);

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setShopForm((prev) => ({
            ...prev,
            name,
            slug: prev.slug || generateSlug(name),
        }));
    };

    const handleSaveShop = async () => {
        setIsSaving(true);
        setSaveMessage("");
        try {
            await upsertBusiness({
                name: shopForm.name,
                slug: shopForm.slug,
                phone: shopForm.phone || null,
                imageUrl: shopForm.imageUrl || null,
                logoUrl: shopForm.logoUrl || null,
            });
            setSaveMessage("Saved!");
            refetch();
            setTimeout(() => setSaveMessage(""), 2000);
        } catch (error) {
            setSaveMessage("Error saving");
        }
        setIsSaving(false);
    };

    const handleAddService = async () => {
        if (!shop) return;
        try {
            await createService({
                businessId: shop.id,
                name: serviceForm.name,
                description: serviceForm.description || null,
                duration: serviceForm.duration,
                price: serviceForm.price,
            });
            setServiceForm({ name: "", description: "", duration: 60, price: 0 });
            setShowServiceForm(false);
            refetch();
        } catch (error) {
            console.error("Error adding service:", error);
        }
    };

    const handleUpdateService = async () => {
        if (!editingServiceId) return;
        try {
            await updateService({
                id: editingServiceId,
                name: serviceForm.name,
                description: serviceForm.description || null,
                duration: serviceForm.duration,
                price: serviceForm.price,
            });
            setServiceForm({ name: "", description: "", duration: 60, price: 0 });
            setEditingServiceId(null);
            refetch();
        } catch (error) {
            console.error("Error updating service:", error);
        }
    };

    const handleToggleActive = async (service: any) => {
        try {
            await updateService({
                id: service.id,
                isActive: !service.isActive
            });
            refetch();
        } catch (error) {
            console.error("Error toggling service status:", error);
        }
    };

    const handleDeleteService = async () => {
        if (!deleteModal.serviceId) return;
        setIsDeleting(true);
        try {
            await deleteService({ id: deleteModal.serviceId });
            refetch();
            setDeleteModal({ isOpen: false, serviceId: null, serviceName: "" });
        } catch (error) {
            console.error("Error deleting service:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const startEditService = (service: any) => {
        setServiceForm({
            name: service.name,
            description: service.description || "",
            duration: service.duration,
            price: service.price,
        });
        setEditingServiceId(service.id);
        setShowServiceForm(false);
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-muted-foreground font-bold">Loading...</div>
                </div>
            </DashboardLayout>
        );
    }

    const bookingUrl = shop?.slug ? `/book/${shop.slug}` : null;

    return (
        <DashboardLayout>
            <div className="max-w-3xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-black uppercase tracking-tight">Links</h1>
                    <p className="text-muted-foreground mt-2 font-medium">
                        Set up your booking page details and services.
                    </p>
                </div>

                {/* Preview Link */}
                {bookingUrl && (
                    <div className="mb-8 bg-[#FFEB3B] border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                        <div>
                            <p className="text-[#0000FF] font-black text-sm uppercase tracking-widest">
                                Your Booking Page
                            </p>
                            <a
                                href={bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0000FF] font-bold underline"
                            >
                                {window.location.origin}{bookingUrl}
                            </a>
                        </div>
                        <a
                            href={bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#0000FF] text-white p-2 border-2 border-black"
                        >
                            <ExternalLink className="size-5" />
                        </a>
                    </div>
                )}

                {/* Shop Settings Form */}
                <div className="bg-background border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-6">
                        Shop Details
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name" className="font-bold uppercase text-xs tracking-widest">
                                Shop Name
                            </Label>
                            <Input
                                id="name"
                                value={shopForm.name}
                                onChange={handleNameChange}
                                placeholder="My Awesome Shop"
                                className="mt-1 border-2 border-black rounded-none"
                            />
                        </div>

                        <div>
                            <Label htmlFor="slug" className="font-bold uppercase text-xs tracking-widest">
                                URL Slug
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-muted-foreground text-sm">/book/</span>
                                <Input
                                    id="slug"
                                    value={shopForm.slug}
                                    onChange={(e) => setShopForm((prev) => ({ ...prev, slug: e.target.value }))}
                                    placeholder="my-awesome-shop"
                                    className="border-2 border-black rounded-none"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="imageUrl" className="font-bold uppercase text-xs tracking-widest">
                                Cover Image URL (Optional)
                            </Label>
                            <Input
                                id="imageUrl"
                                value={shopForm.imageUrl}
                                onChange={(e) => setShopForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                                placeholder="https://example.com/cover.jpg"
                                className="mt-1 border-2 border-black rounded-none"
                            />
                        </div>

                        <div>
                            <Label htmlFor="logoUrl" className="font-bold uppercase text-xs tracking-widest">
                                Logo URL (Optional)
                            </Label>
                            <Input
                                id="logoUrl"
                                value={shopForm.logoUrl}
                                onChange={(e) => setShopForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
                                placeholder="https://example.com/logo.jpg"
                                className="mt-1 border-2 border-black rounded-none"
                            />
                        </div>

                        <div>
                            <Label htmlFor="phone" className="font-bold uppercase text-xs tracking-widest">
                                Phone Number (Optional)
                            </Label>
                            <Input
                                id="phone"
                                value={shopForm.phone}
                                onChange={(e) => setShopForm((prev) => ({ ...prev, phone: e.target.value }))}
                                placeholder="+1 (555) 123-4567"
                                className="mt-1 border-2 border-black rounded-none"
                            />
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <Button
                                onClick={handleSaveShop}
                                disabled={isSaving || !shopForm.name || !shopForm.slug}
                                className="bg-primary text-black border-2 border-black font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all rounded-none"
                            >
                                <Save className="size-4 mr-2" />
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                            {saveMessage && (
                                <span className="text-sm font-bold text-green-600">{saveMessage}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Services Section */}
                {shop && (
                    <div className="bg-background border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black uppercase tracking-tight">
                                Services
                            </h2>
                            <Button
                                onClick={() => {
                                    setShowServiceForm(true);
                                    setEditingServiceId(null);
                                    setServiceForm({ name: "", description: "", duration: 60, price: 0 });
                                }}
                                className="bg-black text-white border-2 border-black font-black uppercase text-xs tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all rounded-none"
                            >
                                <Plus className="size-4 mr-1" />
                                Add
                            </Button>
                        </div>

                        {/* Service Form */}
                        {(showServiceForm || editingServiceId) && (
                            <div className="bg-muted border-2 border-black p-4 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-black uppercase text-sm">
                                        {editingServiceId ? "Edit Service" : "New Service"}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowServiceForm(false);
                                            setEditingServiceId(null);
                                            setServiceForm({ name: "", description: "", duration: 60, price: 0 });
                                        }}
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Label className="font-bold uppercase text-xs tracking-widest">Name</Label>
                                        <Input
                                            value={serviceForm.name}
                                            onChange={(e) => setServiceForm((prev) => ({ ...prev, name: e.target.value }))}
                                            placeholder="Haircut"
                                            className="mt-1 border-2 border-black rounded-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label className="font-bold uppercase text-xs tracking-widest">Description (Optional)</Label>
                                        <Textarea
                                            value={serviceForm.description}
                                            onChange={(e) => setServiceForm((prev) => ({ ...prev, description: e.target.value }))}
                                            placeholder="A quick trim and style..."
                                            className="mt-1 border-2 border-black rounded-none resize-none"
                                            rows={2}
                                        />
                                    </div>
                                    <div>
                                        <Label className="font-bold uppercase text-xs tracking-widest">Duration (minutes)</Label>
                                        <Input
                                            type="number"
                                            value={serviceForm.duration}
                                            onChange={(e) => setServiceForm((prev) => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                                            className="mt-1 border-2 border-black rounded-none"
                                        />
                                    </div>
                                    <div>
                                        <Label className="font-bold uppercase text-xs tracking-widest">Price ($)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={serviceForm.price}
                                            onChange={(e) => setServiceForm((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                            className="mt-1 border-2 border-black rounded-none"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <Button
                                        onClick={editingServiceId ? handleUpdateService : handleAddService}
                                        disabled={!serviceForm.name}
                                        className="bg-primary text-black border-2 border-black font-black uppercase text-xs tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all rounded-none"
                                    >
                                        {editingServiceId ? "Update" : "Add Service"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Services List */}
                        {shop.services && shop.services.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {[...shop.services].sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)).map((service: any) => (
                                    <div
                                        key={service.id}
                                        className={cn(
                                            "group relative border-2 border-black bg-background p-4 flex flex-col justify-between aspect-square hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all",
                                            !service.isActive && "opacity-60 grayscale-[0.5]"
                                        )}
                                    >
                                        <div>
                                            <h4 className="font-black uppercase text-sm leading-tight line-clamp-2">{service.name}</h4>
                                            {service.description && (
                                                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-tight">
                                                    {service.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-auto">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-xl font-black">${service.price.toFixed(2)}</div>
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
                                                    onClick={() => startEditService(service)}
                                                    className="p-1.5 bg-white border-2 border-black hover:bg-muted transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                                                    title="Edit Service"
                                                >
                                                    <Edit2 className="size-3" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, serviceId: service.id, serviceName: service.name })}
                                                    className="p-1.5 bg-red-100 border-2 border-black hover:bg-red-200 transition-all text-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                                                    title="Delete Service"
                                                >
                                                    <Trash2 className="size-3" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleToggleActive(service)}
                                                className={`px-3 py-1.5 border-2 border-black font-black text-[10px] uppercase transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] ${service.isActive ? "bg-gray-200 text-black" : "bg-green-400 text-black"
                                                    }`}
                                            >
                                                {service.isActive ? "Deactivate" : "Activate"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No services yet. Add your first service to get started!
                            </p>
                        )}
                    </div>
                )}
            </div>
            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4 text-left">
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
        </DashboardLayout>
    );
}
