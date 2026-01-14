import type { GetBusinessByUser, GetServicesByBusinessAndUserId, UpsertBusiness, CreateService, UpdateService, DeleteService, GetBookingsByBusiness, GetBookingsByUser, GetCustomersByBusiness, CreateBooking, GetSchedule, UpdateSchedule, UpdateScheduleOverride, GetPromosByBusiness, CreatePromo, UpdatePromo, DeletePromo, GetCalendarBookings, GetReviewsByBusiness, CreateReview, DeleteReview, GetGoogleAuthUrl } from "wasp/server/operations";
import { deleteFileFromS3, getDownloadFileSignedURLFromS3 } from "../file-upload/s3Utils";
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent, formatBookingForCalendar } from "../server/integrations/googleCalendar";

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
    instagramUrl?: string | null;
    isInstagramEnabled?: boolean;
    tiktokUrl?: string | null;
    isTikTokEnabled?: boolean;
    facebookUrl?: string | null;
    isFacebookEnabled?: boolean;
    websiteUrl?: string | null;
    isWebsiteEnabled?: boolean;
    contactEmail?: string | null;
    isContactEmailEnabled?: boolean;
    isPhoneEnabled?: boolean;
    styleTemplate?: string;
    styleBackground?: string;
    stylePrimaryColor?: string;
    styleSecondaryColor?: string;
};

export const upsertBusiness: UpsertBusiness<UpsertBusinessArgs, any> = async (args, context) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });

    const businessData = {
        name: args.name,
        slug: args.slug,
        phone: args.phone,
        imageUrl: args.imageUrl,
        logoUrl: args.logoUrl,
        instagramUrl: args.instagramUrl,
        isInstagramEnabled: args.isInstagramEnabled,
        tiktokUrl: args.tiktokUrl,
        isTikTokEnabled: args.isTikTokEnabled,
        facebookUrl: args.facebookUrl,
        isFacebookEnabled: args.isFacebookEnabled,
        websiteUrl: args.websiteUrl,
        isWebsiteEnabled: args.isWebsiteEnabled,
        contactEmail: args.contactEmail,
        isContactEmailEnabled: args.isContactEmailEnabled,
        isPhoneEnabled: args.isPhoneEnabled,
        styleTemplate: args.styleTemplate,
        styleBackground: args.styleBackground,
        stylePrimaryColor: args.stylePrimaryColor,
        styleSecondaryColor: args.styleSecondaryColor,
    };

    if (user?.businessId) {
        // Update existing business
        return await context.entities.Business.update({
            where: { id: user.businessId },
            data: businessData,
        });
    } else {
        // Create new business and mark user as owner
        const business = await context.entities.Business.create({
            data: {
                ...businessData,
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

type UpdateIntegrationsArgs = {
    isGoogleCalendarConnected?: boolean;
    isStripeConnected?: boolean;
};

export const updateIntegrations: any = async (args: UpdateIntegrationsArgs, context: any) => {
    if (!context.user) throw new Error("You must be logged in");

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });

    if (!user?.businessId) throw new Error("Business not found");

    return await context.entities.Business.update({
        where: { id: user.businessId },
        data: {
            ...(args.isGoogleCalendarConnected !== undefined && { isGoogleCalendarConnected: args.isGoogleCalendarConnected }),
            ...(args.isStripeConnected !== undefined && { isStripeConnected: args.isStripeConnected }),
        }
    });
};

export const disconnectGoogleCalendar: any = async (_args: {}, context: any) => {
    if (!context.user) throw new Error("You must be logged in");

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });

    if (!user?.businessId) throw new Error("Business not found");

    // Revoke the token at Google's end if it exists
    if (user.googRefreshToken) {
        try {
            await fetch('https://oauth2.googleapis.com/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    token: user.googRefreshToken,
                }),
            });
            console.log('✅ Google token revoked successfully');
        } catch (error) {
            console.error('Failed to revoke Google token:', error);
            // Continue anyway to clean up our database
        }
    }

    // Remove the refresh token from User
    await context.entities.User.update({
        where: { id: context.user.id },
        data: {
            googRefreshToken: null,
        },
    });

    // Update Business connection status
    await context.entities.Business.update({
        where: { id: user.businessId },
        data: {
            isGoogleCalendarConnected: false,
        },
    });

    return { success: true };
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
    timezone?: string;
    bufferBefore?: number;
    bufferAfter?: number;
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
            ...(args.timezone !== undefined && { timezone: args.timezone }),
            ...(args.bufferBefore !== undefined && { bufferBefore: args.bufferBefore }),
            ...(args.bufferAfter !== undefined && { bufferAfter: args.bufferAfter }),
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

export const getSchedule: GetSchedule<void, any> = async (_args, context) => {
    if (!context.user) throw new Error("You must be logged in");

    let schedule = await context.entities.Schedule.findFirst({
        where: { userId: context.user.id },
        include: { days: true, overrides: true }
    });

    if (!schedule) {
        schedule = await context.entities.Schedule.create({
            data: {
                userId: context.user.id,
                name: "Default Schedule",
                days: {
                    createMany: {
                        data: [
                            { dayOfWeek: "mon", startTime: "09:00", endTime: "17:00" },
                            { dayOfWeek: "tue", startTime: "09:00", endTime: "17:00" },
                            { dayOfWeek: "wed", startTime: "09:00", endTime: "17:00" },
                            { dayOfWeek: "thu", startTime: "09:00", endTime: "17:00" },
                            { dayOfWeek: "fri", startTime: "09:00", endTime: "17:00" },
                        ]
                    }
                }
            },
            include: { days: true, overrides: true }
        });
    }
    return schedule;
};

type UpdateScheduleArgs = {
    scheduleId: string;
    days: {
        dayOfWeek: string;
        startTime: string; // HH:MM
        endTime: string;   // HH:MM
    }[];
};

export const updateSchedule: UpdateSchedule<UpdateScheduleArgs, any> = async (args, context) => {
    if (!context.user) throw new Error("You must be logged in");

    const schedule = await context.entities.Schedule.findUnique({
        where: { id: args.scheduleId },
    });

    if (!schedule || schedule.userId !== context.user.id) {
        throw new Error("Schedule not found or access denied");
    }

    // Replace all days
    await context.entities.ScheduleDay.deleteMany({
        where: { scheduleId: args.scheduleId }
    });

    if (args.days.length > 0) {
        await context.entities.ScheduleDay.createMany({
            data: args.days.map(d => ({
                scheduleId: args.scheduleId,
                dayOfWeek: d.dayOfWeek,
                startTime: d.startTime,
                endTime: d.endTime
            }))
        });
    }

    return await context.entities.Schedule.findUnique({
        where: { id: args.scheduleId },
        include: { days: true, overrides: true }
    });
};

type UpdateScheduleOverrideArgs = {
    id?: string;
    scheduleId: string;
    dates: string[];
    isUnavailable: boolean;
    startTime?: string;
    endTime?: string;
    action?: 'upsert' | 'delete';
};

export const updateScheduleOverride: UpdateScheduleOverride<UpdateScheduleOverrideArgs, any> = async (args, context) => {
    if (!context.user) throw new Error("You must be logged in");

    const schedule = await context.entities.Schedule.findUnique({
        where: { id: args.scheduleId },
    });

    if (!schedule || schedule.userId !== context.user.id) {
        throw new Error("Schedule not found or access denied");
    }

    if (args.action === 'delete' && args.id) {
        await context.entities.ScheduleOverride.delete({
            where: { id: args.id }
        });
        return { deleted: true };
    }

    // Upsert logic for multiple dates
    // For each selected date, we either update an existing override or create a new one.
    const results: any[] = [];
    for (const date of args.dates) {
        // Check if an override already exists for this date and schedule
        // Note: This relies on the application logic to prevent duplicates if no DB constraint exists.
        // ideally we would use upsert with a unique compound key, but findFirst works for now.
        const existing = await context.entities.ScheduleOverride.findFirst({
            where: {
                scheduleId: args.scheduleId,
                date: date
            }
        });

        if (existing) {
            const updated = await context.entities.ScheduleOverride.update({
                where: { id: existing.id },
                data: {
                    isUnavailable: args.isUnavailable,
                    startTime: args.isUnavailable ? null : args.startTime,
                    endTime: args.isUnavailable ? null : args.endTime
                }
            });
            results.push(updated);
        } else {
            const created = await context.entities.ScheduleOverride.create({
                data: {
                    scheduleId: args.scheduleId,
                    date: date,
                    isUnavailable: args.isUnavailable,
                    startTime: args.isUnavailable ? null : args.startTime,
                    endTime: args.isUnavailable ? null : args.endTime
                }
            });
            results.push(created);
        }
    }

    return results;
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

export const getBookingsByUser: GetBookingsByUser<void, any> = async (_args, context) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });

    if (!user?.businessId) {
        return [];
    }

    // Get bookings for the current user (staff) within their business
    const bookings = await context.entities.Booking.findMany({
        where: {
            businessId: user.businessId,
            staffId: context.user.id,
        },
        include: {
            customer: true,
            service: true,
            staff: true,
        },
        orderBy: { startTimeUtc: "asc" },
    });

    return bookings;
};

export const getCalendarBookings: GetCalendarBookings<{ staffId?: string }, any> = async (args, context) => {
    if (!context.user) {
        throw new Error("You must be logged in");
    }

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });

    if (!user?.businessId) {
        return [];
    }

    const whereClause: any = {
        businessId: user.businessId,
    };

    // If staffId is provided and not 'all', filter by it
    if (args.staffId && args.staffId !== 'all') {
        whereClause.staffId = args.staffId;
    }

    // If no staffId provided, default to current user if not owner? 
    // The requirement is "options to view business calendar... and options to view calendar for each users".
    // If filtering is NOT applied (staffId is undefined or 'all'), we show ALL bookings for the business.
    // However, we should probably restrict this to owners if sensitive? 
    // For now, let's assume any staff can see the business calendar if requested, or at least owners.
    // Let's implement it such that 'all' returns all business bookings.

    const bookings = await context.entities.Booking.findMany({
        where: whereClause,
        include: {
            customer: true,
            service: true,
            staff: true,
        },
        orderBy: { startTimeUtc: "asc" },
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
        include: {
            bookings: {
                orderBy: { date: "desc" },
                take: 1,
            },
            _count: {
                select: { bookings: true },
            },
        },
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
                userId: args.staffId, // Assign customer to the staff member being booked
            },
        });
    }

    // Compute UTC timestamps from date and time
    const [hours, mins] = args.time.split(':').map(Number);
    const bookingDateObj = new Date(args.date);
    const startTimeUtc = new Date(Date.UTC(
        bookingDateObj.getUTCFullYear(),
        bookingDateObj.getUTCMonth(),
        bookingDateObj.getUTCDate(),
        hours,
        mins
    ));
    const endTimeUtc = new Date(startTimeUtc.getTime() + service.duration * 60000);

    // Create booking
    let booking = await context.entities.Booking.create({
        data: {
            businessId: business.id,
            customerId: customer.id,
            serviceId: args.serviceId,
            staffId: args.staffId,
            date: new Date(args.date),
            price: service.price,
            notes: args.notes,
            status: "confirmed",
            startTimeUtc,
            endTimeUtc,
        },
        include: {
            customer: true,
            service: true,
            staff: true,
        },
    });

    // Sync to Google Calendar if staff has connected
    const staff = await context.entities.User.findUnique({
        where: { id: args.staffId },
    });

    if (staff?.googRefreshToken) {
        try {
            const eventData = formatBookingForCalendar({
                service,
                customer,
                staff: booking.staff,
                startTimeUtc,
                endTimeUtc,
                notes: args.notes,
                price: service.price,
            });
            const eventId = await createGoogleCalendarEvent(staff.googRefreshToken, eventData);

            if (eventId) {
                booking = await context.entities.Booking.update({
                    where: { id: booking.id },
                    data: { googleCalendarEventId: eventId },
                    include: { customer: true, service: true, staff: true },
                });
            }
        } catch (error) {
            console.error('Failed to sync booking to Google Calendar:', error);
            // Don't throw - booking was created successfully, just sync failed
        }
    }

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
    let newServiceDuration: number | undefined;
    if (args.serviceId && args.serviceId !== booking.serviceId) {
        const newService = await context.entities.Service.findUnique({
            where: { id: args.serviceId },
        });
        if (newService) {
            price = newService.price;
            newServiceDuration = newService.duration;
        }
    }

    // Compute new UTC timestamps if date or time changed
    let startTimeUtc: Date | undefined;
    let endTimeUtc: Date | undefined;
    if (args.date || args.time) {
        const dateToUse = args.date ? new Date(args.date) : booking.date;
        const timeToUse = args.time || `${booking.startTimeUtc.getUTCHours().toString().padStart(2, '0')}:${booking.startTimeUtc.getUTCMinutes().toString().padStart(2, '0')}`;
        const [hours, mins] = timeToUse.split(':').map(Number);

        startTimeUtc = new Date(Date.UTC(
            dateToUse.getUTCFullYear(),
            dateToUse.getUTCMonth(),
            dateToUse.getUTCDate(),
            hours,
            mins
        ));

        // Use new service duration if changed, otherwise derive from existing booking
        const durationMs = newServiceDuration
            ? newServiceDuration * 60000
            : (booking.endTimeUtc.getTime() - booking.startTimeUtc.getTime());
        endTimeUtc = new Date(startTimeUtc.getTime() + durationMs);
    } else if (newServiceDuration) {
        // Only service changed, update endTimeUtc based on new duration
        endTimeUtc = new Date(booking.startTimeUtc.getTime() + newServiceDuration * 60000);
    }

    // Update booking
    const updatedBooking = await context.entities.Booking.update({
        where: { id: args.id },
        data: {
            ...(args.serviceId && { serviceId: args.serviceId }),
            ...(args.staffId && { staffId: args.staffId }),
            ...(args.date && { date: new Date(args.date) }),
            ...(args.notes !== undefined && { notes: args.notes }),
            ...(args.status && { status: args.status }),
            ...(startTimeUtc && { startTimeUtc }),
            ...(endTimeUtc && { endTimeUtc }),
            price,
        },
        include: {
            customer: true,
            service: true,
            staff: true,
        },
    });

    // Sync update to Google Calendar if event exists
    if (booking.googleCalendarEventId) {
        const staff = await context.entities.User.findUnique({
            where: { id: updatedBooking.staffId },
        });

        if (staff?.googRefreshToken) {
            try {
                const eventData = formatBookingForCalendar({
                    service: updatedBooking.service,
                    customer: updatedBooking.customer,
                    staff: updatedBooking.staff,
                    startTimeUtc: updatedBooking.startTimeUtc,
                    endTimeUtc: updatedBooking.endTimeUtc,
                    notes: updatedBooking.notes,
                    price: updatedBooking.price,
                });
                await updateGoogleCalendarEvent(staff.googRefreshToken, booking.googleCalendarEventId, eventData);
            } catch (error) {
                console.error('Failed to update Google Calendar event:', error);
            }
        }
    }

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

    // Delete from Google Calendar if event exists
    if (booking.googleCalendarEventId) {
        const staff = await context.entities.User.findUnique({
            where: { id: booking.staffId },
        });

        if (staff?.googRefreshToken) {
            try {
                await deleteGoogleCalendarEvent(staff.googRefreshToken, booking.googleCalendarEventId);
            } catch (error) {
                console.error('Failed to delete Google Calendar event:', error);
            }
        }
    }

    await context.entities.Booking.delete({
        where: { id: args.id },
    });

    return { success: true };
};

// Promo Operations

export const getPromosByBusiness: GetPromosByBusiness<void, any> = async (_args, context) => {
    if (!context.user) throw new Error("You must be logged in");

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });

    if (!user?.businessId) return [];

    return await context.entities.Promo.findMany({
        where: { businessId: user.businessId },
        orderBy: { createdAt: "desc" }
    });
};

type CreatePromoArgs = {
    code: string;
    type: string; // "percent" | "fixed"
    value: number;
};

export const createPromo: CreatePromo<CreatePromoArgs, any> = async (args, context) => {
    if (!context.user) throw new Error("You must be logged in");

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });

    if (!user?.businessId) throw new Error("Business not found");

    // Check if code already exists for this business
    const existing = await context.entities.Promo.findFirst({
        where: {
            businessId: user.businessId,
            code: args.code
        }
    });

    if (existing) throw new Error("Promo code already exists");

    return await context.entities.Promo.create({
        data: {
            businessId: user.businessId,
            code: args.code,
            type: args.type,
            value: args.value,
            isActive: true
        }
    });
};

type UpdatePromoArgs = {
    id: string;
    isActive: boolean;
};

export const updatePromo: UpdatePromo<UpdatePromoArgs, any> = async (args, context) => {
    if (!context.user) throw new Error("You must be logged in");

    const promo = await context.entities.Promo.findUnique({
        where: { id: args.id }
    });

    if (!promo) throw new Error("Promo not found");

    // Verify ownership
    const user = await context.entities.User.findUnique({
        where: { id: context.user.id }
    });

    if (!user?.businessId || promo.businessId !== user.businessId) {
        throw new Error("Access denied");
    }

    return await context.entities.Promo.update({
        where: { id: args.id },
        data: { isActive: args.isActive }
    });
};

export const deletePromo: DeletePromo<{ id: string }, any> = async (args, context) => {
    if (!context.user) throw new Error("You must be logged in");

    const promo = await context.entities.Promo.findUnique({
        where: { id: args.id }
    });

    if (!promo) throw new Error("Promo not found");

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id }
    });

    if (!user?.businessId || promo.businessId !== user.businessId) {
        throw new Error("Access denied");
    }

    await context.entities.Promo.delete({
        where: { id: args.id }
    });

    return { success: true };
};

// Review Operations

export const getReviewsByBusiness: GetReviewsByBusiness<void, any> = async (_args, context) => {
    if (!context.user) throw new Error("You must be logged in");
    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });
    if (!user?.businessId) return [];

    return await context.entities.Review.findMany({
        where: { businessId: user.businessId },
        include: {
            booking: {
                include: {
                    customer: true,
                    service: true
                }
            },
            user: true // staff member
        },
        orderBy: { createdAt: "desc" }
    });
};

type CreateReviewArgs = {
    bookingId: string;
    rating: number;
    title?: string;
    content?: string;
};

export const createReview: CreateReview<CreateReviewArgs, any> = async (args, context) => {
    if (!context.user) throw new Error("You must be logged in");

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id },
    });
    if (!user?.businessId) throw new Error("Business not found");

    const booking = await context.entities.Booking.findUnique({
        where: { id: args.bookingId },
        include: { staff: true }
    });

    if (!booking) throw new Error("Booking not found");

    // Check if review already exists
    const existing = await context.entities.Review.findUnique({
        where: { bookingId: args.bookingId }
    });
    if (existing) throw new Error("Review already exists for this booking");

    return await context.entities.Review.create({
        data: {
            businessId: user.businessId,
            bookingId: args.bookingId,
            rating: args.rating,
            title: args.title,
            content: args.content,
            userId: booking.staffId // Link to the staff member who performed the service
        }
    });
};

export const deleteReview: DeleteReview<{ id: string }, any> = async (args, context) => {
    if (!context.user) throw new Error("You must be logged in");

    const review = await context.entities.Review.findUnique({
        where: { id: args.id }
    });
    if (!review) throw new Error("Review not found");

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id }
    });

    if (!user?.businessId || review.businessId !== user.businessId) {
        throw new Error("Access denied");
    }

    await context.entities.Review.delete({
        where: { id: args.id }
    });

    return { success: true };
};

export const getGoogleAuthUrl: GetGoogleAuthUrl<void, string> = async (_args, context) => {
    if (!context.user) throw new Error("Not authorized");

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.WASP_WEB_SERVER_URL}/google/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar';

    // Encode user ID in state to preserve identity across redirect
    const state = Buffer.from(JSON.stringify({ userId: context.user.id })).toString('base64');

    const params = new URLSearchParams({
        client_id: clientId!,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scope,
        access_type: 'offline',
        prompt: 'consent',
        state: state, // Pass user ID through the redirect
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const getGoogleCalendarStatus: any = async (_args: {}, context: any) => {
    if (!context.user) throw new Error("Not authorized");

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id }
    });

    return { isConnected: !!user?.googRefreshToken };
};

export const getGoogleCalendarEvents: any = async (args: { timeMin: string; timeMax: string }, context: any) => {
    if (!context.user) throw new Error("Not authorized");

    const user = await context.entities.User.findUnique({
        where: { id: context.user.id }
    });

    if (!user?.googRefreshToken) {
        return { events: [] };
    }

    try {
        const { fetchGoogleCalendarEvents } = await import('../server/integrations/googleCalendar');
        const events = await fetchGoogleCalendarEvents(
            user.googRefreshToken,
            new Date(args.timeMin),
            new Date(args.timeMax)
        );

        return { events };
    } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        return { events: [] };
    }
};
