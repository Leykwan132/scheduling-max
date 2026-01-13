/**
 * availableSlots.ts
 *
 * Compute available appointment slots for a single working window given existing bookings.
 * - Uses JS Date objects internally and expects inputs to be consistent in timezone.
 * - Optionally returns ISO strings for API consumption.
 *
 * Exported:
 * - availableSlotsForWindow(options): TimeSlot[] | string[] (ISO)
 * - helper functions and types for unit testing and composition.
 */

export type TimeRange = { start: Date; end: Date };
export type Booking = TimeRange;

export interface AvailableSlotsOptions {
    // Working window
    workingStart: Date | string;
    workingEnd: Date | string;

    // Existing bookings (may include other days)
    bookings?: Array<Booking | { start: Date | string; end: Date | string }>;

    // Slot configuration
    slotLengthMinutes: number; // required
    slotStepMinutes?: number; // defaults to slotLengthMinutes

    // Buffers around bookings (minutes)
    bufferBeforeMinutes?: number;
    bufferAfterMinutes?: number;

    // Earliest allowed slot start (lead time). If provided, can be Date or ISO string.
    earliestStart?: Date | string | null;

    // Align the start of each free interval to the next multiple of this minute grid (e.g., 15)
    alignToMinutes?: number | null;

    // Return ISO string array instead of Date objects
    returnIso?: boolean;
}

/**
 * Utility: normalize input to Date.
 */
function toDate(d: Date | string): Date {
    return d instanceof Date ? d : new Date(d);
}

/**
 * Merge overlapping or touching intervals.
 * Expects arbitrary unsorted intervals; returns sorted, disjoint intervals.
 */
export function mergeIntervals(intervals: TimeRange[]): TimeRange[] {
    if (!intervals || intervals.length === 0) return [];

    const sorted = intervals
        .map(({ start, end }) => ({ start: toDate(start), end: toDate(end) }))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    const merged: TimeRange[] = [];
    let cur = { start: sorted[0].start, end: sorted[0].end };

    for (let i = 1; i < sorted.length; i++) {
        const it = sorted[i];
        if (it.start.getTime() <= cur.end.getTime()) {
            // overlapping or touching
            cur.end = new Date(Math.max(cur.end.getTime(), it.end.getTime()));
        } else {
            merged.push(cur);
            cur = { start: it.start, end: it.end };
        }
    }
    merged.push(cur);
    return merged;
}

/**
 * Expand intervals by beforeMs and afterMs (for buffers).
 */
export function expandIntervals(intervals: TimeRange[], beforeMs = 0, afterMs = 0): TimeRange[] {
    return intervals.map(({ start, end }) => ({
        start: new Date(start.getTime() - beforeMs),
        end: new Date(end.getTime() + afterMs),
    }));
}

/**
 * Subtract busy intervals (assumed sorted & disjoint) from a single working window.
 * Returns an array of free TimeRange(s) contained within working.
 */
export function subtractBusyFromWorking(working: TimeRange, busy: TimeRange[]): TimeRange[] {
    const free: TimeRange[] = [];
    const wStart = toDate(working.start);
    const wEnd = toDate(working.end);
    if (wStart.getTime() >= wEnd.getTime()) return free;

    let cursor = new Date(wStart.getTime());

    for (const b of busy) {
        // busy ends before cursor: skip
        if (b.end.getTime() <= cursor.getTime()) continue;
        // busy starts after working end: we're done
        if (b.start.getTime() >= wEnd.getTime()) break;

        const freeStart = cursor;
        const freeEnd = new Date(Math.min(b.start.getTime(), wEnd.getTime()));
        if (freeStart.getTime() < freeEnd.getTime()) free.push({ start: freeStart, end: freeEnd });

        // move cursor past this busy interval
        cursor = new Date(Math.max(cursor.getTime(), b.end.getTime()));
        if (cursor.getTime() >= wEnd.getTime()) break;
    }

    // trailing free interval
    if (cursor.getTime() < wEnd.getTime()) free.push({ start: cursor, end: wEnd });

    return free;
}

/**
 * Round up a Date to the nearest multiple of `minutes` (in minutes).
 * If minutes is null/<=0, return the original date clone.
 */
export function ceilToGrid(d: Date, minutes: number | null): Date {
    if (!minutes || minutes <= 0) return new Date(d.getTime());
    const ms = minutes * 60_000;
    const t = d.getTime();
    return new Date(Math.ceil(t / ms) * ms);
}

/**
 * From a list of free intervals, generate discrete slots of slotLengthMs stepping by slotStepMs.
 * If alignToMinutes is set, the first slot start for each free interval is ceil'd to that grid.
 */
export function generateSlotsFromFree(
    freeIntervals: TimeRange[],
    slotLengthMs: number,
    slotStepMs: number,
    alignToMinutes: number | null = null
): TimeRange[] {
    const slots: TimeRange[] = [];

    for (const { start: freeStart, end: freeEnd } of freeIntervals) {
        let slotStart = ceilToGrid(freeStart, alignToMinutes);
        // If alignment moved start past freeEnd, skip
        while (slotStart.getTime() + slotLengthMs <= freeEnd.getTime()) {
            const slotEnd = new Date(slotStart.getTime() + slotLengthMs);
            slots.push({ start: new Date(slotStart.getTime()), end: slotEnd });
            slotStart = new Date(slotStart.getTime() + slotStepMs);
        }
    }

    return slots;
}

/**
 * Main exported function.
 *
 * Returns an array of TimeRange (Date objects) by default, or array of ISO strings if options.returnIso === true.
 */
export function availableSlotsForWindow(opts: AvailableSlotsOptions): Array<TimeRange | string> {
    const {
        workingStart,
        workingEnd,
        bookings = [],
        slotLengthMinutes,
        slotStepMinutes,
        bufferBeforeMinutes = 0,
        bufferAfterMinutes = 0,
        earliestStart = null,
        alignToMinutes = null,
        returnIso = false,
    } = opts;

    if (!slotLengthMinutes || slotLengthMinutes <= 0) {
        throw new Error("slotLengthMinutes is required and must be > 0");
    }

    const wStart = toDate(workingStart);
    const wEnd = toDate(workingEnd);
    const earliest = earliestStart ? toDate(earliestStart) : null;

    const slotLengthMs = slotLengthMinutes * 60_000;
    const slotStepMs = (slotStepMinutes ?? slotLengthMinutes) * 60_000;
    const bufferBeforeMs = bufferBeforeMinutes * 60_000;
    const bufferAfterMs = bufferAfterMinutes * 60_000;

    // Filter bookings that can affect the window (considering buffers)
    const relevant: TimeRange[] = [];
    for (const b of bookings) {
        const bs = toDate((b as any).start ?? (b as Booking).start);
        const be = toDate((b as any).end ?? (b as Booking).end);
        if (be.getTime() <= wStart.getTime() - bufferBeforeMs) continue;
        if (bs.getTime() >= wEnd.getTime() + bufferAfterMs) continue;
        relevant.push({ start: bs, end: be });
    }

    // Expand bookings by buffers and merge overlapping ones
    const expanded = expandIntervals(relevant, bufferBeforeMs, bufferAfterMs);
    const mergedBusy = mergeIntervals(expanded);

    // Subtract busy intervals from working window -> free intervals
    const freeIntervals = subtractBusyFromWorking({ start: wStart, end: wEnd }, mergedBusy);

    // Apply earliestStart (lead time)
    const freeAfterLead: TimeRange[] = [];
    if (earliest) {
        for (const { start: fs, end: fe } of freeIntervals) {
            if (fe.getTime() <= earliest.getTime()) continue;
            const newStart = fs.getTime() < earliest.getTime() ? earliest : fs;
            if (newStart.getTime() < fe.getTime()) freeAfterLead.push({ start: newStart, end: fe });
        }
    } else {
        freeAfterLead.push(...freeIntervals);
    }

    // Generate discrete slots
    const slots = generateSlotsFromFree(freeAfterLead, slotLengthMs, slotStepMs, alignToMinutes);

    if (returnIso) {
        return slots.map((s) => `${s.start.toISOString()}|${s.end.toISOString()}`);
    }
    return slots;
}