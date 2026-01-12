import type { GetUserBySlug, GetAvailableSlots, CreatePublicBooking } from "wasp/server/operations";
import { HttpError } from "wasp/server";
import { getDownloadFileSignedURLFromS3 } from "../file-upload/s3Utils";

export const getUserBySlug: GetUserBySlug<{ slug: string }, any> = async (args, context) => {
    const user = await context.entities.User.findUnique({
        where: { slug: args.slug },
        include: {
            business: true,
            services: {
                where: { isActive: true },
                orderBy: { createdAt: "asc" },
            },
            profileImageFile: {
                select: { s3Key: true }
            },
        },
    });

    if (!user) {
        throw new HttpError(404, "User not found");
    }

    // Generate signed URL for profile image
    let profileImageUrl: string | undefined = undefined;
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
};

export const getAvailableSlots: GetAvailableSlots<{ slug: string; date: string }, string[]> = async (args, context) => {
    const user = await context.entities.User.findUnique({
        where: { slug: args.slug },
    });

    if (!user) throw new HttpError(404, "User not found");
    if (!user.openingTime || !user.closingTime || !user.workDays) return [];

    const date = new Date(args.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    const workDays = user.workDays.toLowerCase().split(',');

    if (!workDays.includes(dayName)) return [];

    // Get existing bookings for this user on this day
    const startOfDay = new Date(args.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(args.date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await context.entities.Booking.findMany({
        where: {
            staffId: user.id,
            date: {
                gte: startOfDay,
                lte: endOfDay,
            },
            status: { notIn: ["cancelled"] }
        },
    });

    const [openH, openM] = user.openingTime.split(':').map(Number);
    const [closeH, closeM] = user.closingTime.split(':').map(Number);

    const slots: string[] = [];
    let current = new Date(args.date);
    current.setHours(openH, openM, 0, 0);

    const finish = new Date(args.date);
    finish.setHours(closeH, closeM, 0, 0);

    // 30-minute intervals
    while (current < finish) {
        const timeStr = current.toTimeString().slice(0, 5);

        // Check if slot is taken
        const isAvailable = !bookings.some(b => b.startTime === timeStr);
        if (isAvailable) {
            slots.push(timeStr);
        }

        current.setMinutes(current.getMinutes() + 30);
    }

    return slots;
};

export const createPublicBooking: CreatePublicBooking<any, any> = async (args, context) => {
    const { slug, serviceId, date, time, clientName, clientPhone, clientEmail, notes } = args;

    const user = await context.entities.User.findUnique({
        where: { slug },
        include: { business: true }
    });

    if (!user || !user.businessId) throw new HttpError(404, "Provider not found");

    const service = await context.entities.Service.findUnique({
        where: { id: serviceId }
    });

    if (!service) throw new HttpError(404, "Service not found");

    // 1. Upsert Customer
    let customer = await context.entities.Customer.findFirst({
        where: {
            phone: clientPhone,
            businessId: user.businessId
        }
    });

    if (!customer) {
        customer = await context.entities.Customer.create({
            data: {
                name: clientName,
                phone: clientPhone,
                email: clientEmail,
                businessId: user.businessId,
                userId: user.id
            }
        });
    }

    // 2. Create Booking
    return await context.entities.Booking.create({
        data: {
            businessId: user.businessId,
            customerId: customer.id,
            serviceId: service.id,
            staffId: user.id,
            date: new Date(date),
            startTime: time,
            duration: service.duration,
            price: service.price,
            notes,
            status: "confirmed"
        }
    });
};
