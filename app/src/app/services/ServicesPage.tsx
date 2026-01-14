import { useState, useEffect } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { Briefcase, Plus, Edit2, Trash2, X } from "lucide-react";
import { useQuery, useAction } from "wasp/client/operations";
import { useAuth } from "wasp/client/auth";
import { getBusinessByUser, getServicesByBusinessAndUserId, createService, updateService, deleteService } from "wasp/client/operations";
import { cn } from "../../client/utils";
import { ToastContainer } from "../../client/components/Toast";

export default function ServicesPage() {
    const { data: user } = useAuth();
    const { data: business, refetch: refetchBusiness } = useQuery(getBusinessByUser);
    const { data: services, refetch: refetchServices } = useQuery(
        getServicesByBusinessAndUserId,
        business?.id && user?.id ? { businessId: business.id, userId: user.id } : undefined,
        { enabled: !!business?.id && !!user?.id }
    );

    const createServiceAction = useAction(createService);
    const updateServiceAction = useAction(updateService);
    const deleteServiceAction = useAction(deleteService);

    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);
    const [serviceForm, setServiceForm] = useState({
        name: "",
        duration: 30,
        price: 0,
        description: "",
        isActive: true
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' }>>([]);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; serviceId: string | null; serviceName: string }>({
        isOpen: false,
        serviceId: null,
        serviceName: ""
    });

    const addToast = (message: string, type: 'success' | 'error') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
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
            addToast(`Service ${service.isActive ? 'deactivated' : 'activated'}!`, 'success');
        } catch (error: any) {
            addToast("Failed to toggle service status", 'error');
        }
    };

    // Format duration for display
    const formatDuration = (minutes: number) => {
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${minutes}m`;
    };

    return (
        <DashboardLayout>
            <div className="w-full max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                            Services
                        </h1>
                        <p className="text-muted-foreground mt-2 font-medium">
                            Manage your services, pricing, and durations.
                        </p>
                    </div>
                    <button
                        onClick={() => openServiceModal()}
                        className="bg-primary text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center gap-2 font-black text-sm uppercase"
                    >
                        <Plus className="size-4" />
                        Add Service
                    </button>
                </div>

                {/* Services Grid */}
                {services && services.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...services].sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)).map((service: any) => (
                            <div
                                key={service.id}
                                className={cn(
                                    "group relative bg-background border-2 border-black p-5 aspect-square flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all",
                                    !service.isActive && "opacity-60 grayscale-[0.3]"
                                )}
                            >
                                <div>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="bg-primary p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <Briefcase className="size-4 text-black" />
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
                                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                                            {service.description}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-auto pt-2 border-t-2 border-black/5">
                                    <p className="text-xl font-black leading-none">${service.price}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                                        {formatDuration(service.duration)}
                                    </p>
                                </div>

                                <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openServiceModal(service)}
                                            className="p-2 border-2 border-black bg-white hover:bg-muted transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]"
                                        >
                                            <Edit2 className="size-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, serviceId: service.id, serviceName: service.name })}
                                            className="p-2 border-2 border-black bg-red-100 hover:bg-red-200 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]"
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
                        ))}
                    </div>
                ) : (
                    <div className="bg-background border-2 border-black p-12 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <Briefcase className="size-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-black uppercase text-lg mb-2">No Services Yet</h3>
                        <p className="text-muted-foreground mb-6">
                            Add your first service to start accepting bookings.
                        </p>
                        <button
                            onClick={() => openServiceModal()}
                            className="bg-primary text-black px-6 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-black text-sm uppercase"
                        >
                            <Plus className="size-4 inline mr-2" />
                            Add Service
                        </button>
                    </div>
                )}

                {/* Service Modal */}
                {isServiceModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
                        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg animate-in zoom-in-95 fade-in duration-200">
                            <div className="bg-primary px-6 py-4 border-b-4 border-black flex items-center justify-between">
                                <h2 className="text-xl font-black uppercase">{editingService ? "Edit" : "New"} Service</h2>
                                <button onClick={() => setIsServiceModalOpen(false)} className="p-2 border-2 border-black bg-white">
                                    <X className="size-4" />
                                </button>
                            </div>
                            <form onSubmit={handleServiceSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-black uppercase mb-2">Service Name *</label>
                                    <input
                                        type="text"
                                        value={serviceForm.name}
                                        onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-black font-bold text-sm"
                                        placeholder="e.g. Hair Cut"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-black uppercase mb-2">Description (Optional)</label>
                                    <textarea
                                        value={serviceForm.description}
                                        onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-black font-bold text-sm resize-none"
                                        rows={3}
                                        placeholder="Describe your service..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-black uppercase mb-2">Duration (minutes) *</label>
                                        <input
                                            type="number"
                                            value={serviceForm.duration}
                                            onChange={(e) => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 border-2 border-black font-bold text-sm"
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-black uppercase mb-2">Price ($) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={serviceForm.price}
                                            onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 border-2 border-black font-bold text-sm"
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsServiceModalOpen(false)}
                                        className="flex-1 py-3 border-2 border-black font-black text-sm uppercase hover:bg-muted/50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 py-3 bg-primary text-black border-2 border-black font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] disabled:opacity-70 transition-all"
                                    >
                                        {isSaving ? "Saving..." : editingService ? "Update" : "Create"}
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
            </div>
        </DashboardLayout>
    );
}
