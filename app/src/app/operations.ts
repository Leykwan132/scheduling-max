import type { GetBusinessByUser, GetServicesByBusinessAndUserId, UpsertBusiness, CreateService, UpdateService, DeleteService, GetBookingsByBusiness, GetCustomersByBusiness, CreateBooking } from "wasp/server/operations";
import { deleteFileFromS3, getDownloadFileSignedURLFromS3 } from "../file-upload/s3Utils";

// Queries

export const getBusinessByUser: GetBusinessByUser<void, any> = async (_args, context) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    if (!context.user.businessId) {
        throw new Error("Business not found");
    }

    const business = await context.entities.Business.findFirst({
        where: { id: context.user.businessId },
        include: {
            services: {
                where: { userId: context.user.id }
            },
            users: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    profileImageFile: {
                        select: { s3Key: true }
                    },
                    position: true,
                    isBusinessOwner: true,
                    openingTime: true,
                    closingTime: true,
                    workDays: true,
                    igUrl: true,
                    tiktokUrl: true,
                    facebookUrl: true,
                    websiteUrl: true,
                    publicEmail: true,
                    publicPhone: true
                }
            }
        }
    });

    if (!business) return null;

    // Generate signed URLs for profile images
    const usersWithSignedUrls = await Promise.all(
        business.users.map(async (user: any) => {
            let profileImageUrl: string | null = null;
            if (user.profileImageFile?.s3Key) {
                try {
                    profileImageUrl = await getDownloadFileSignedURLFromS3({ s3Key: user.profileImageFile.s3Key });
                } catch (error) {
                    console.error("Error generating signed URL for profile image:", error);
                }
            }
            return {
                ...user,
                profileImageUrl,
                profileImageFile: undefined, // Don't expose s3Key to client
            };
        })
    );

    return {
        ...business,
        users: usersWithSignedUrls,
    };
};

export const getServicesByBusinessAndUserId: GetServicesByBusinessAndUserId<{ businessId: string, userId?: string }, any> = async (args, context) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    const services = await context.entities.Service.findMany({
        where: {
            businessId: args.businessId,
            ...(args.userId && { userId: args.userId })
        },
        orderBy: { createdAt: "asc" },
    });

    return services;
};

// Actions

type UpsertBusinessArgs = {
    name: string;
    slug: string;
    phone?: string | null;
    imageUrl?: string | null;
    logoUrl?: string | null;
};

export const upsertBusiness: UpsertBusiness<UpsertBusinessArgs, any> = async (args, context) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });

    if (user?.businessId) {
        // Update existing business
        return await context.entities.Business.update({
            where: { id: user.businessId },
            data: {
                name: args.name,
                slug: args.slug,
                phone: args.phone,
                imageUrl: args.imageUrl,
                logoUrl: args.logoUrl,
            },
        });
    } else {
        // Create new business and mark user as owner
        const business = await context.entities.Business.create({
            data: {
                name: args.name,
                slug: args.slug,
                phone: args.phone,
                imageUrl: args.imageUrl,
                logoUrl: args.logoUrl,
                users: { connect: { id: context.user.id } }
            },
        });

        await context.entities.User.update({
            where: { id: context.user.id },
            data: { isBusinessOwner: true }
        });

        return business;
    }
};

type UpdateUserProfileArgs = {
    slug?: string;
    bio?: string;
    profileImage?: string;
    position?: string;
    username?: string;
    openingTime?: string;
    closingTime?: string;
    workDays?: string;
};

export const updateUserProfile: any = async (args: UpdateUserProfileArgs, context: any) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    return await context.entities.User.update({
        where: { id: context.user.id },
        data: {
            // Only update fields that are provided
            ...(args.slug !== undefined && { slug: args.slug }),
            ...(args.bio !== undefined && { bio: args.bio }),
            ...(args.profileImage !== undefined && { profileImage: args.profileImage }),
            ...(args.position !== undefined && { position: args.position }),
            ...(args.username !== undefined && { username: args.username }),
            ...(args.openingTime !== undefined && { openingTime: args.openingTime }),
            ...(args.closingTime !== undefined && { closingTime: args.closingTime }),
            ...(args.workDays !== undefined && { workDays: args.workDays }),
        },
    });
};

type UpdateUserProfileImageArgs = {
    newFileId: string;
};

export const updateUserProfileImage: any = async (args: UpdateUserProfileImageArgs, context: any) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    // Get the current user with their existing profile image file
    const currentUser = await context.entities.User.findUnique({
        where: { id: context.user.id },
        include: { profileImageFile: true },
    });

    // If there's an existing profile image, delete it from S3 and database
    if (currentUser?.profileImageFile) {
        if (currentUser.profileImageFile.s3Key) {
            await deleteFileFromS3(currentUser.profileImageFile.s3Key);
        }
        await context.entities.File.delete({
            where: { id: currentUser.profileImageFile.id },
        });
    }

    // Update user to link to the new file
    return await context.entities.User.update({
        where: { id: context.user.id },
        data: {
            profileImageFile: {
                connect: { id: args.newFileId }
            }
        },
    });
};

type CreateServiceArgs = {
    businessId: string;
    name: string;
    description?: string | null;
    duration: number;
    price: number;
};

export const createService: CreateService<CreateServiceArgs, any> = async (args, context) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    // Verify the business belongs to the user
    // We can rely on context.user.businessId, but context.user from Wasp might need refreshing or we assume it's up to date.
    // Safest is to check against the DB or just check IDs if we trust the session.
    // Since we are creating a service for a specific businessId passed in args:

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });

    if (!user?.businessId || user.businessId !== args.businessId) {
        throw new Error("Business not found or access denied");
    }

    return await context.entities.Service.create({
        data: {
            businessId: args.businessId,
            userId: context.user.id, // Current user becomes the owner of this service
            name: args.name,
            description: args.description,
            duration: args.duration,
            price: args.price,
        },
    });
};

type UpdateServiceArgs = {
    id: string;
    name?: string;
    description?: string | null;
    duration?: number;
    price?: number;
    isActive?: boolean;
};

export const updateService: UpdateService<UpdateServiceArgs, any> = async (args, context) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    // Verify the service belongs to the user's business
    const service = await context.entities.Service.findUnique({
        where: { id: args.id },
    });

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });

    if (!service || !user?.businessId || service.businessId !== user.businessId || (service.userId && service.userId !== context.user.id)) {
        throw new Error("Service not found or access denied");
    }

    const { id, ...updateData } = args;

    return await context.entities.Service.update({
        where: { id },
        data: updateData,
    });
};

export const deleteService: DeleteService<{ id: string }, any> = async (args, context) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    // Verify the service belongs to the user's business
    const service = await context.entities.Service.findUnique({
        where: { id: args.id },
    });

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });

    if (!service || !user?.businessId || service.businessId !== user.businessId || (service.userId && service.userId !== context.user.id)) {
        throw new Error("Service not found or access denied");
    }

    return await context.entities.Service.delete({
        where: { id: args.id },
    });
};

// Booking Operations

export const getBookingsByBusiness: GetBookingsByBusiness<void, any> = async (_args, context) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });

    if (!user?.businessId) {
        return [];
    }

    const bookings = await context.entities.Booking.findMany({
        where: { businessId: user.businessId },
        include: {
            customer: true,
            service: true,
            staff: true,
        },
        orderBy: { date: "asc" },
    });

    return bookings;
};


export const getCustomersByBusiness: GetCustomersByBusiness<void, any> = async (_args, context) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });

    if (!user?.businessId) {
        return [];
    }

    const whereClause: any = { businessId: user.businessId };

    // If user is not the owner, they only see their own customers
    // (Adjust this logic based on precise requirements, assuming strict ownership)
    if (!user.isBusinessOwner) {
        whereClause.userId = context.user.id;
    }

    const customers = await context.entities.Customer.findMany({
        where: whereClause,
        orderBy: { name: "asc" },
    });

    return customers;
};

type CreateBookingArgs = {
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    serviceId: string;
    staffId: string;
    date: string; // ISO date string
    time: string; // "09:00" format
    notes?: string;
};

export const createBooking: CreateBooking<CreateBookingArgs, any> = async (args, context) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
        include: { business: true }
    });

    const business = user?.business;

    if (!business) {
        throw new Error("Business not found");
    }

    // Get service to calculate price and duration
    const service = await context.entities.Service.findUnique({
        where: { id: args.serviceId },
    });

    if (!service || service.businessId !== business.id) {
        throw new Error("Service not found");
    }

    // Find or create customer
    let customer = await context.entities.Customer.findFirst({
        where: {
            businessId: business.id,
            phone: args.clientPhone,
        },
    });

    if (!customer) {
        customer = await context.entities.Customer.create({
            data: {
                businessId: business.id,
                name: args.clientName,
                phone: args.clientPhone,
                email: args.clientEmail,
                userId: context.user.id, // Assign customer to the staff creating the booking
            },
        });
    }

    // Create booking
    const booking = await context.entities.Booking.create({
        data: {
            businessId: business.id,
            customerId: customer.id,
            serviceId: args.serviceId,
            staffId: args.staffId,
            date: new Date(args.date),
            startTime: args.time,
            duration: service.duration,
            price: service.price,
            notes: args.notes,
            status: "confirmed",
        },
        include: {
            customer: true,
            service: true,
            staff: true,
        },
    });

    return booking;
};


type UpdateBookingArgs = {
    id: string;
    clientName?: string;
    clientPhone?: string;
    serviceId?: string;
    staffId?: string;
    date?: string;
    time?: string;
    notes?: string;
    status?: string;
};

export const updateBooking: any = async (args: UpdateBookingArgs, context: any) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    const booking = await context.entities.Booking.findUnique({
        where: { id: args.id },
        include: { business: true, customer: true, service: true },
    });

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });

    if (!booking || !user?.businessId || booking.businessId !== user.businessId) {
        throw new Error("Booking not found or access denied");
    }

    // Update customer if name or phone changed
    if (args.clientName || args.clientPhone) {
        await context.entities.Customer.update({
            where: { id: booking.customerId },
            data: {
                ...(args.clientName && { name: args.clientName }),
                ...(args.clientPhone && { phone: args.clientPhone }),
            },
        });
    }

    // Get new service if serviceId changed
    let price = booking.price;
    let duration = booking.duration;
    if (args.serviceId && args.serviceId !== booking.serviceId) {
        const newService = await context.entities.Service.findUnique({
            where: { id: args.serviceId },
        });
        if (newService) {
            price = newService.price;
            duration = newService.duration;
        }
    }

    // Update booking
    const updatedBooking = await context.entities.Booking.update({
        where: { id: args.id },
        data: {
            ...(args.serviceId && { serviceId: args.serviceId }),
            ...(args.staffId && { staffId: args.staffId }),
            ...(args.date && { date: new Date(args.date) }),
            ...(args.time && { startTime: args.time }),
            ...(args.notes !== undefined && { notes: args.notes }),
            ...(args.status && { status: args.status }),
            price,
            duration,
        },
        include: {
            customer: true,
            service: true,
            staff: true,
        },
    });

    return updatedBooking;
};

export const deleteBooking: any = async (args: { id: string }, context: any) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    const booking = await context.entities.Booking.findUnique({
        where: { id: args.id },
        include: { business: true },
    });

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });

    if (!booking || !user?.businessId || booking.businessId !== user.businessId) {
        throw new Error("Booking not found or access denied");
    }

    await context.entities.Booking.delete({
        where: { id: args.id },
    });

    return { success: true };
};
