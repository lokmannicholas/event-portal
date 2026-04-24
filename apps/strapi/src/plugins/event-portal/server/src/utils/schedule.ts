function addMinutes(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(':').map((value) => Number(value));
  const total = hours * 60 + minutes + minutesToAdd;
  const nextHours = Math.floor(total / 60);
  const nextMinutes = total % 60;
  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
}

function enumerateDates(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const dates: string[] = [];

  for (let value = new Date(start); value <= end; value.setUTCDate(value.getUTCDate() + 1)) {
    dates.push(value.toISOString().slice(0, 10));
  }

  return dates;
}

export function buildEventSchedule(input: {
  eventStartDate: string;
  eventEndDate: string;
  dayStartTime: string;
  dayEndTime: string;
  timeslotDurationMinutes: number;
  quotaPerSlot: number;
}) {
  const dates = enumerateDates(input.eventStartDate, input.eventEndDate);
  const slots: Array<{
    eventDate: string;
    startTime: string;
    endTime: string;
    enabled: boolean;
    quota: number;
    usedCount: number;
    holdCount: number;
    sortOrder: number;
  }> = [];

  for (const date of dates) {
    let current = input.dayStartTime;
    let sortOrder = 10;

    while (current < input.dayEndTime) {
      const nextTime = addMinutes(current, input.timeslotDurationMinutes);

      if (nextTime > input.dayEndTime) {
        break;
      }

      slots.push({
        eventDate: date,
        startTime: current,
        endTime: nextTime,
        enabled: true,
        quota: input.quotaPerSlot,
        usedCount: 0,
        holdCount: 0,
        sortOrder,
      });

      current = nextTime;
      sortOrder += 10;
    }
  }

  return slots;
}
