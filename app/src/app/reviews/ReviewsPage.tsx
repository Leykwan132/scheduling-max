import { useQuery, useAction, getReviewsByBusiness, deleteReview, createReview } from "wasp/client/operations";
import DashboardLayout from "../layout/DashboardLayout";
import { Star, Trash2, User, Calendar, MessageSquare, Plus } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function ReviewsPage() {
    const { data: reviews, isLoading, error } = useQuery(getReviewsByBusiness);
    const reviewsList = (Array.isArray(reviews) ? reviews : []) as any[];
    const deleteReviewAction = useAction(deleteReview);
    // Debug: Action to create a fake review if needed for testing, though normally comes from booking
    // We won't implement a full UI for creating reviews here as it's customer facing usually.

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this review?")) {
            try {
                await deleteReviewAction({ id });
            } catch (error) {
                console.error("Failed to delete review", error);
            }
        }
    };

    const calculateAverageRating = () => {
        if (!reviewsList || reviewsList.length === 0) return 0;
        const sum = reviewsList.reduce((acc: number, review: any) => acc + review.rating, 0);
        return (sum / reviewsList.length).toFixed(1);
    };

    return (
        <DashboardLayout>
            <div className="w-full max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                            Reviews
                        </h1>
                        <p className="text-muted-foreground mt-2 font-medium">
                            Manage customer feedback and ratings.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Debug Button - Remove in production */}
                        <button
                            onClick={async () => {
                                const bookingId = window.prompt("Enter Booking ID for test review:");
                                if (!bookingId) return;
                                try {
                                    await createReview({
                                        bookingId,
                                        rating: 5,
                                        title: "Amazing Service!",
                                        content: "Really loved the haircut. Highly recommended!"
                                    });
                                    alert("Test review created!");
                                } catch (e: any) {
                                    alert("Error: " + e.message);
                                }
                            }}
                            className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded border border-black font-bold uppercase transition-colors"
                        >
                            + Test Review
                        </button>

                        {/* Stats Card */}
                        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
                            <div className="bg-yellow-400 p-2 border-2 border-black">
                                <Star className="size-6 text-black fill-black" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase text-muted-foreground">Average Rating</p>
                                <p className="text-2xl font-black">{calculateAverageRating()} / 5.0</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews List */}
                {isLoading ? (
                    <div className="text-center py-12">Loading reviews...</div>
                ) : error ? (
                    <div className="text-red-500">Error loading reviews: {error.message}</div>
                ) : (
                    <div className="grid gap-6">
                        {reviewsList.length === 0 ? (
                            <div className="text-center py-16 bg-muted/20 border-2 border-dashed border-black/20 rounded-lg">
                                <MessageSquare className="size-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-xl font-bold text-muted-foreground">No reviews yet</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                                    Reviews form customers after their appointments will appear here.
                                </p>
                            </div>
                        ) : (
                            reviewsList.map((review: any) => (
                                <div
                                    key={review.id}
                                    className="bg-background border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                                >
                                    <div className="flex flex-col md:flex-row gap-6 justify-between">
                                        <div className="flex-1 space-y-4">
                                            {/* Header: Rating & Title */}
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`size-5 ${i < review.rating
                                                                    ? "fill-yellow-400 text-black"
                                                                    : "text-muted-foreground/30"
                                                                    }`}
                                                            />
                                                        ))}
                                                        <span className="ml-2 font-black text-lg">{review.rating}.0</span>
                                                    </div>
                                                    {review.title && (
                                                        <h3 className="font-bold text-lg">{review.title}</h3>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-block px-2 py-1 bg-muted border-2 border-black text-xs font-bold uppercase">
                                                        {format(new Date(review.createdAt), "MMM d, yyyy")}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            {review.content && (
                                                <p className="text-muted-foreground leading-relaxed border-l-4 border-primary pl-4 py-1 italic">
                                                    "{review.content}"
                                                </p>
                                            )}

                                            {/* Context Info */}
                                            <div className="flex flex-wrap items-center gap-4 pt-2 text-sm font-bold opacity-80">
                                                <div className="flex items-center gap-2">
                                                    <User className="size-4" />
                                                    <span>{review.booking?.customer?.name || "Anonymous Customer"}</span>
                                                </div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
                                                <div className="flex items-center gap-2">
                                                    <span>Service: {review.booking?.service?.name}</span>
                                                </div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-black/20" />
                                                <div className="flex items-center gap-2 text-primary">
                                                    <span>Staff: {review.user?.username || "Unknown Staff"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-start pl-4 md:border-l-2 border-gray-100">
                                            <button
                                                onClick={() => handleDelete(review.id)}
                                                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 border-2 border-transparent hover:border-black transition-all"
                                                title="Delete Review"
                                            >
                                                <Trash2 className="size-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
