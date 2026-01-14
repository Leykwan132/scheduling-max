import { faker } from "@faker-js/faker";
import type { PrismaClient } from "@prisma/client";
import { type User } from "wasp/entities";
import {
  getSubscriptionPaymentPlanIds,
  SubscriptionStatus,
} from "../../payment/plans";

type MockUserData = Omit<User, "id">;

/**
 * This function, which we've imported in `app.db.seeds` in the `main.wasp` file,
 * seeds the database with mock users via the `wasp db seed` command.
 * For more info see: https://wasp.sh/docs/data-model/backends#seeding-the-database
 */
export async function seedMockUsers(prismaClient: PrismaClient) {
  await Promise.all(
    generateMockUsersData(50).map((data) => prismaClient.user.create({ data })),
  );
}

function generateMockUsersData(numOfUsers: number): MockUserData[] {
  return faker.helpers.multiple(generateMockUserData, { count: numOfUsers });
}

function generateMockUserData(): MockUserData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const subscriptionStatus =
    faker.helpers.arrayElement<SubscriptionStatus | null>([
      ...Object.values(SubscriptionStatus),
      null,
    ]);
  const now = new Date();
  const createdAt = faker.date.past({ refDate: now });
  const timePaid = faker.date.between({ from: createdAt, to: now });
  const credits = subscriptionStatus
    ? 0
    : faker.number.int({ min: 0, max: 10 });
  const hasUserPaidOnStripe = !!subscriptionStatus || credits > 3;
  return {
    email: faker.internet.email({ firstName, lastName }),
    username: faker.internet.userName({ firstName, lastName }),
    createdAt,
    isAdmin: false,
    credits,
    subscriptionStatus,
    lemonSqueezyCustomerPortalUrl: null,
    googRefreshToken: null,
    paymentProcessorUserId: hasUserPaidOnStripe
      ? `cus_test_${faker.string.uuid()}`
      : null,
    datePaid: hasUserPaidOnStripe
      ? faker.date.between({ from: createdAt, to: timePaid })
      : null,
    subscriptionPlan: subscriptionStatus
      ? faker.helpers.arrayElement(getSubscriptionPaymentPlanIds())
      : null,
    profileImageFileId: null,
    slug: faker.helpers.slugify(`${firstName}-${lastName}-${faker.string.alphanumeric(4)}`).toLowerCase(),
    bio: faker.person.bio(),
    position: faker.person.jobTitle(),
    openingTime: "09:00",
    closingTime: "17:00",
    workDays: "mon,tue,wed,thu,fri",
    businessId: null,
    isBusinessOwner: false,
    igUrl: null,
    tiktokUrl: null,
    facebookUrl: null,
    websiteUrl: null,
    publicEmail: null,
    publicPhone: null,
    timezone: "UTC",
    bufferBefore: 0,
    bufferAfter: 0,
  };
}

/**
 * Seeds services for all existing businesss that don't have services yet
 */
export async function seedServices(prismaClient: PrismaClient) {
  console.log("Seeding services...");

  const serviceData = [
    { name: "Hair Cut", description: "Classic haircut", duration: 60, price: 50 },
    { name: "Beard Trim", description: "Beard styling and trim", duration: 30, price: 25 },
    { name: "Hair Color", description: "Full color treatment", duration: 120, price: 120 },
    { name: "Full Service", description: "Haircut, wash, and style", duration: 90, price: 85 },
    { name: "Shave", description: "Hot towel shave", duration: 45, price: 30 },
    { name: "Hair Styling", description: "Blow dry and style", duration: 60, price: 60 },
    { name: "Deep Conditioning", description: "Hair treatment", duration: 45, price: 45 },
    { name: "Highlights", description: "Partial or full highlights", duration: 120, price: 150 },
  ];

  // Get all businesss
  const businesss = await prismaClient.business.findMany();

  for (const business of businesss) {
    const existingServices = await prismaClient.service.count({
      where: { businessId: business.id },
    });

    if (existingServices === 0) {
      // Get the first user of this business to assign services to
      const firstUser = await prismaClient.user.findFirst({
        where: { businessId: business.id }
      });

      if (firstUser) {
        await Promise.all(
          serviceData.map((s) =>
            prismaClient.service.create({
              data: { ...s, businessId: business.id, userId: firstUser.id },
            })
          )
        );
        console.log(`Created ${serviceData.length} services for business: ${business.name} (User: ${firstUser.username})`);
      }
    }
  }

  console.log("Services seeding complete!");
}


/**
 * Seeds booking-related data for the demo business:
 * - Customers  
 * - Bookings for the current month
 */
export async function seedBookingData(prismaClient: PrismaClient) {
  console.log("Seeding booking data...");

  // Find or create a demo user
  let demoUser = await prismaClient.user.findFirst({
    where: { email: "demo@schedulemax.com" },
  });

  if (!demoUser) {
    demoUser = await prismaClient.user.create({
      data: {
        email: "demo@schedulemax.com",
        username: "demouser",
        isAdmin: false,
        credits: 10,
        isBusinessOwner: true,
        openingTime: "09:00",
        closingTime: "17:00",
        workDays: "mon,tue,wed,thu,fri",
      },
    });
    console.log("Created demo user");
  }

  // Find or create demo business
  let business = await prismaClient.business.findFirst({
    where: { users: { some: { id: demoUser.id } } },
  });

  if (!business) {
    business = await prismaClient.business.create({
      data: {
        users: { connect: { id: demoUser.id } },
        name: "ScheduleMax Demo Salon",
        slug: "demo-salon",
        phone: "+1 (555) 123-4567",
      },
    });
    console.log("Created demo business");
  }

  // Create services if they don't exist
  const existingServices = await prismaClient.service.findMany({
    where: { businessId: business.id },
  });

  let services = existingServices;
  if (services.length === 0) {
    const serviceData = [
      { name: "Hair Cut", description: "Classic haircut", duration: 60, price: 50 },
      { name: "Beard Trim", description: "Beard styling and trim", duration: 30, price: 25 },
      { name: "Hair Color", description: "Full color treatment", duration: 120, price: 120 },
      { name: "Full Service", description: "Haircut, wash, and style", duration: 90, price: 85 },
      { name: "Shave", description: "Hot towel shave", duration: 45, price: 30 },
      { name: "Hair Styling", description: "Blow dry and style", duration: 60, price: 60 },
      { name: "Deep Conditioning", description: "Hair treatment", duration: 45, price: 45 },
      { name: "Highlights", description: "Partial or full highlights", duration: 120, price: 150 },
    ];

    services = await Promise.all(
      serviceData.map((s) =>
        prismaClient.service.create({
          data: { ...s, businessId: business!.id, userId: demoUser!.id },
        })
      )
    );
    console.log(`Created ${services.length} services`);
  }


  // Create customers if they don't exist
  const existingCustomers = await prismaClient.customer.findMany({
    where: { businessId: business.id },
  });

  let customers = existingCustomers;
  if (customers.length === 0) {
    const customerData = Array.from({ length: 25 }, () => ({
      name: faker.person.fullName(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
    }));

    customers = await Promise.all(
      customerData.map((c) =>
        prismaClient.customer.create({
          data: { ...c, businessId: business!.id, userId: demoUser.id },
        })
      )
    );
    console.log(`Created ${customers.length} customers`);
  }

  // Create bookings for the current month
  const existingBookings = await prismaClient.booking.count({
    where: { businessId: business.id },
  });

  if (existingBookings === 0) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const timeSlots = [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "12:00", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00",
      "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"
    ];

    const bookings: {
      businessId: string;
      customerId: string;
      serviceId: string;
      staffId: string;
      date: Date;
      price: number;
      status: string;
      startTimeUtc: Date;
      endTimeUtc: Date;
    }[] = [];

    // Generate 7-8 bookings per day for the month
    for (let day = startOfMonth; day <= endOfMonth; day.setDate(day.getDate() + 1)) {
      const numBookings = faker.number.int({ min: 7, max: 8 });
      const usedTimes = new Set<string>();

      for (let i = 0; i < numBookings; i++) {
        let time: string;
        do {
          time = faker.helpers.arrayElement(timeSlots);
        } while (usedTimes.has(time));
        usedTimes.add(time);

        const customer = faker.helpers.arrayElement(customers);
        const service = faker.helpers.arrayElement(services);
        const status = "confirmed";

        // Compute UTC timestamps from date and time
        const [hours, mins] = time.split(':').map(Number);
        const bookingDay = new Date(day);
        const startTimeUtc = new Date(Date.UTC(
          bookingDay.getFullYear(),
          bookingDay.getMonth(),
          bookingDay.getDate(),
          hours,
          mins
        ));
        const endTimeUtc = new Date(startTimeUtc.getTime() + service.duration * 60000);

        bookings.push({
          businessId: business!.id,
          customerId: customer.id,
          serviceId: service.id,
          staffId: demoUser!.id, // Use demo user as staff
          date: new Date(day),
          price: service.price,
          status,
          startTimeUtc,
          endTimeUtc,
        });
      }
    }

    await prismaClient.booking.createMany({ data: bookings });
    console.log(`Created ${bookings.length} bookings`);
  }

  console.log("Booking data seeding complete!");
}

