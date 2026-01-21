import { useState } from "react";
import { useQuery, useAction, getFormsByUser, getCategoriesByBusiness, createForm, updateForm, deleteForm } from "wasp/client/operations";
import DashboardLayout from "../layout/DashboardLayout";
import { Plus, Trash2, GripVertical, ChevronLeft, ToggleLeft, ToggleRight, Type, CheckSquare, List, CircleDot, X } from "lucide-react";
import { cn } from "../../client/utils";

type QuestionType = "text" | "checkbox" | "checkbox_list" | "yes_no" | "dropdown";

interface Question {
    id?: string;
    type: QuestionType;
    label: string;
    options?: string;
    isRequired: boolean;
    order: number;
}

interface FormData {
    id?: string;
    name: string;
    description: string;
    isInternal: boolean;
    categoryIds: string[];
    questions: Question[];
}

const questionTypes: { type: QuestionType; label: string; icon: React.ElementType }[] = [
    { type: "text", label: "Textbox", icon: Type },
    { type: "dropdown", label: "Drop Down List", icon: List },
    { type: "checkbox", label: "Checkbox", icon: CheckSquare },
    { type: "checkbox_list", label: "Checkbox List", icon: List },
    { type: "yes_no", label: "Yes/No Choice", icon: CircleDot },
];

const emptyForm: FormData = {
    name: "",
    description: "",
    isInternal: false,
    categoryIds: [],
    questions: [],
};

export default function FormsPage() {
    const { data: formsData, isLoading, refetch } = useQuery(getFormsByUser);
    const forms = formsData as any[] | undefined;
    const { data: categoriesData } = useQuery(getCategoriesByBusiness);
    const categories = categoriesData as any[] | undefined;
    const createFormAction = useAction(createForm);
    const updateFormAction = useAction(updateForm);
    const deleteFormAction = useAction(deleteForm);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<FormData>(emptyForm);
    const [isSaving, setIsSaving] = useState(false);

    const handleCreateNew = () => {
        setFormData({ ...emptyForm, questions: [] });
        setIsEditing(true);
    };

    const handleEdit = (form: any) => {
        setFormData({
            id: form.id,
            name: form.name || "",
            description: form.description || "",
            isInternal: form.isInternal || false,
            categoryIds: form.categories?.map((c: any) => c.id) || [],
            questions: form.questions?.map((q: any, idx: number) => ({
                id: q.id,
                type: q.type as QuestionType,
                label: q.label,
                options: q.options,
                isRequired: q.isRequired,
                order: q.order ?? idx,
            })) || [],
        });
        setIsEditing(true);
    };

    const handleBack = () => {
        setIsEditing(false);
        setFormData(emptyForm);
    };

    const handleAddQuestion = (type: QuestionType) => {
        const newQuestion: Question = {
            type,
            label: "",
            isRequired: false,
            order: formData.questions.length,
            options: type === "checkbox_list" || type === "dropdown" ? "Option 1, Option 2, Option 3" : undefined,
        };
        setFormData({ ...formData, questions: [...formData.questions, newQuestion] });
    };

    const handleUpdateQuestion = (index: number, updates: Partial<Question>) => {
        const updated = [...formData.questions];
        updated[index] = { ...updated[index], ...updates };
        setFormData({ ...formData, questions: updated });
    };

    const handleRemoveQuestion = (index: number) => {
        const updated = formData.questions.filter((_, i) => i !== index);
        // Reorder
        updated.forEach((q, i) => q.order = i);
        setFormData({ ...formData, questions: updated });
    };

    const handleToggleCategory = (categoryId: string) => {
        const existing = formData.categoryIds.includes(categoryId);
        if (existing) {
            setFormData({ ...formData, categoryIds: formData.categoryIds.filter(id => id !== categoryId) });
        } else {
            setFormData({ ...formData, categoryIds: [...formData.categoryIds, categoryId] });
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (formData.id) {
                await updateFormAction({
                    id: formData.id,
                    name: formData.name || undefined,
                    description: formData.description || undefined,
                    isInternal: formData.isInternal,
                    categoryIds: formData.categoryIds,
                    questions: formData.questions,
                });
            } else {
                await createFormAction({
                    name: formData.name || undefined,
                    description: formData.description || undefined,
                    isInternal: formData.isInternal,
                    categoryIds: formData.categoryIds,
                    questions: formData.questions,
                });
            }
            await refetch();
            setIsEditing(false);
            setFormData(emptyForm);
        } catch (err: any) {
            alert("Error saving form: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this form?")) return;
        try {
            await deleteFormAction({ id });
            await refetch();
        } catch (err: any) {
            alert("Error deleting form: " + err.message);
        }
    };

    if (isEditing) {
        return (
            <DashboardLayout>
                <div className="w-full max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:text-primary transition-colors"
                        >
                            <ChevronLeft className="size-4" />
                            Back
                        </button>
                        <h1 className="text-2xl font-black uppercase tracking-tight">Form Questions</h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Panel - Question Types */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Add Questions</h3>
                                <div className="space-y-2">
                                    {questionTypes.map((qt) => (
                                        <button
                                            key={qt.type}
                                            onClick={() => handleAddQuestion(qt.type)}
                                            className="w-full flex items-center gap-3 px-4 py-3 bg-background border-2 border-black hover:bg-muted transition-all font-bold text-sm"
                                        >
                                            <qt.icon className="size-4" />
                                            {qt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>



                            {/* Category Assignment */}
                            <div className="border-t-2 border-black/10 pt-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Show this form when scheduling:</h3>
                                <div className="space-y-2">
                                    {categories?.map((cat: any) => (
                                        <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.categoryIds.includes(cat.id)}
                                                onChange={() => handleToggleCategory(cat.id)}
                                                className="size-4 border-2 border-black accent-primary"
                                            />
                                            <span className="font-medium text-sm">{cat.name}</span>
                                        </label>
                                    ))}
                                    {(!categories || categories.length === 0) && (
                                        <p className="text-sm text-muted-foreground">No categories found. Create categories in Services first.</p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full mt-4 bg-black text-white px-6 py-3 font-black uppercase tracking-wide border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] transition-all disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : "Save Form"}
                            </button>
                        </div>

                        {/* Right Panel - Form Builder */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Form Name */}
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Form Name (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="ex. Patient History Form (Optional.)"
                                    className="w-full px-4 py-3 border-2 border-black/20 focus:border-black font-medium transition-all outline-none"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Write any instructions you have for your clients here. (Optional.)"
                                    rows={3}
                                    className="w-full px-4 py-3 border-2 border-black/20 focus:border-black font-medium transition-all outline-none resize-none"
                                />
                            </div>

                            {/* Questions List */}
                            <div className="space-y-3">
                                {formData.questions.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <p className="font-medium mb-2">Click any of the question types on the left to add them to your form.</p>
                                        <p className="text-sm">Reminder: We always ask for name, phone and email, so you don't need to ask for those.</p>
                                        <p className="text-sm">What else do you want to know?</p>
                                    </div>
                                ) : (
                                    formData.questions.map((question, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-3 p-4 bg-background border-2 border-black"
                                        >
                                            <GripVertical className="size-5 text-muted-foreground mt-1 cursor-grab flex-shrink-0" />
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                                                        {questionTypes.find(qt => qt.type === question.type)?.label}
                                                    </span>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={question.label}
                                                    onChange={(e) => handleUpdateQuestion(idx, { label: e.target.value })}
                                                    placeholder="Enter your question..."
                                                    className="w-full px-3 py-2 border-2 border-black/20 focus:border-black font-medium transition-all outline-none"
                                                />
                                                {(question.type === "checkbox_list" || question.type === "dropdown") && (
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Options (comma separated)</label>
                                                        <input
                                                            type="text"
                                                            value={question.options || ""}
                                                            onChange={(e) => handleUpdateQuestion(idx, { options: e.target.value })}
                                                            placeholder="Option 1, Option 2, Option 3"
                                                            className="w-full px-3 py-2 border-2 border-black/20 focus:border-black text-sm font-medium transition-all outline-none"
                                                        />
                                                    </div>
                                                )}
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={question.isRequired}
                                                        onChange={(e) => handleUpdateQuestion(idx, { isRequired: e.target.checked })}
                                                        className="size-4 border-2 border-black accent-primary"
                                                    />
                                                    <span className="text-sm font-medium">Required</span>
                                                </label>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveQuestion(idx)}
                                                className="p-2 text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // List View
    return (
        <DashboardLayout>
            <div className="w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">Intake Forms</h1>
                        <p className="text-muted-foreground mt-2 font-medium">
                            Create custom questionnaires to collect information from clients during booking.
                        </p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 bg-primary text-black px-4 py-2.5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-sm uppercase tracking-wide"
                    >
                        <Plus className="size-4" />
                        New Form
                    </button>
                </div>

                {/* Forms List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <p className="font-bold text-muted-foreground uppercase tracking-wide animate-pulse">Loading forms...</p>
                    </div>
                ) : !forms || forms.length === 0 ? (
                    <div className="text-center py-16 bg-background border-2 border-dashed border-black/20">
                        <p className="font-bold text-muted-foreground mb-4">No forms created yet</p>
                        <button
                            onClick={handleCreateNew}
                            className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-black text-sm uppercase tracking-wide"
                        >
                            <Plus className="size-4" />
                            Create Your First Form
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {forms.map((form: any) => (
                            <div
                                key={form.id}
                                className="bg-background border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                                onClick={() => handleEdit(form)}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-black text-lg uppercase tracking-tight">
                                            {form.name || "Untitled Form"}
                                        </h3>
                                        {form.description && (
                                            <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-3 text-xs font-bold text-muted-foreground uppercase">
                                            <span>{form.questions?.length || 0} questions</span>
                                            {form.categories?.length > 0 && (
                                                <span>• {form.categories.map((c: any) => c.name).join(", ")}</span>
                                            )}
                                            {form.isInternal && (
                                                <span className="text-orange-600">• Internal Only</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(form.id);
                                        }}
                                        className="p-2 text-red-500 hover:bg-red-50 border-2 border-transparent hover:border-red-200 transition-all"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
