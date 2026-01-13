-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default Schedule',

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleDay" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "ScheduleDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleOverride" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "dates" TEXT[],
    "isUnavailable" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,

    CONSTRAINT "ScheduleOverride_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleDay" ADD CONSTRAINT "ScheduleDay_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleOverride" ADD CONSTRAINT "ScheduleOverride_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
