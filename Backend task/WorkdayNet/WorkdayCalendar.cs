namespace WorkdayNet;

public class WorkdayCalendar : IWorkdayCalendar
{
    List<DateTime> holidays = new List<DateTime>();
    List<DateTime> recurringHolidays = new List<DateTime>();
    int startHours = 9;
    int startMinutes = 0;
    int stopHours = 17;
    int stopMinutes = 0;

    /// <summary>
    /// Marks a single calendar date as a non-working holiday. Only the date
    /// component is used; any time-of-day on <paramref name="date"/> is ignored.
    /// </summary>
    /// <param name="date">The date to flag as a holiday.</param>
    public void SetHoliday(DateTime date)
    {
        holidays.Add(date);
    }

    /// <summary>
    /// Marks a month/day combination as a non-working holiday for every year.
    /// </summary>
    /// <param name="month">Month of the year, 1–12.</param>
    /// <param name="day">Day of the month, valid for <paramref name="month"/>.</param>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Thrown if <paramref name="month"/> is outside 1–12 or <paramref name="day"/>
    /// is not a valid day for that month.
    /// </exception>
    public void SetRecurringHoliday(int month, int day)
    {
        if (month < 1 || month > 12)
            throw new ArgumentOutOfRangeException(nameof(month), month, "Month must be between 1 and 12.");
        if (day < 1 || day > DateTime.DaysInMonth(2000, month)) // 2000 is a leap year, accepts Feb 29
            throw new ArgumentOutOfRangeException(nameof(day), day, $"Day {day} is not valid for month {month}.");

        recurringHolidays.Add(new DateTime(DateTime.Now.Year, month, day));
    }

    /// <summary>
    /// Defines the daily workday window. The stop time must be strictly after
    /// the start time.
    /// </summary>
    /// <param name="startHours">Hour of day the workday begins, 0–23.</param>
    /// <param name="startMinutes">Minute the workday begins, 0–59.</param>
    /// <param name="stopHours">Hour of day the workday ends, 0–23.</param>
    /// <param name="stopMinutes">Minute the workday ends, 0–59.</param>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Thrown if any component is outside its valid range.
    /// </exception>
    /// <exception cref="ArgumentException">
    /// Thrown if the stop time is not strictly after the start time.
    /// </exception>
    public void SetWorkdayStartAndStop(int startHours, int startMinutes, int stopHours, int stopMinutes)
    {
        if (startHours < 0 || startHours > 23)
            throw new ArgumentOutOfRangeException(nameof(startHours), startHours, "Hour must be between 0 and 23.");
        if (stopHours < 0 || stopHours > 23)
            throw new ArgumentOutOfRangeException(nameof(stopHours), stopHours, "Hour must be between 0 and 23.");
        if (startMinutes < 0 || startMinutes > 59)
            throw new ArgumentOutOfRangeException(nameof(startMinutes), startMinutes, "Minute must be between 0 and 59.");
        if (stopMinutes < 0 || stopMinutes > 59)
            throw new ArgumentOutOfRangeException(nameof(stopMinutes), stopMinutes, "Minute must be between 0 and 59.");
        if (stopHours * 60 + stopMinutes <= startHours * 60 + startMinutes)
            throw new ArgumentException("Workday stop time must be strictly after start time.");

        this.startHours = startHours;
        this.startMinutes = startMinutes;
        this.stopHours = stopHours;
        this.stopMinutes = stopMinutes;
    }

    /// <summary>
    /// Returns the moment that is <paramref name="incrementInWorkdays"/> working
    /// days away from <paramref name="startDate"/>, skipping weekends and
    /// configured holidays. The increment may be fractional (e.g. 0.5 = half a
    /// workday) and may be negative (move backwards in time).
    /// </summary>
    /// <param name="startDate">Anchor date and time. May fall outside the
    /// workday window or on a non-working day; in that case it is snapped to
    /// the next/previous valid working moment in the direction of travel.</param>
    /// <param name="incrementInWorkdays">Number of working days to advance.
    /// Positive moves forward, negative moves backward, zero returns
    /// <paramref name="startDate"/>.</param>
    /// <returns>The resulting working-time-aware <see cref="DateTime"/>.</returns>
    public DateTime GetWorkdayIncrement(DateTime startDate, decimal incrementInWorkdays)
    {
        int workdayMinutes = GetWorkdayDuration();

        // Increment as a multiple of the workday duration, converted to hours and minutes
        int incrementMinutes = GetIncrementDuration(incrementInWorkdays, workdayMinutes);

        // IncrementInWorkdays can be negative so we need a method that works in both directions
        DateTime result = startDate;

        // Need to loop until we have added all the hours and minutes, skipping non-workdays
        // Also need to handle cases where startDate is on a non-workday or outside business hours
        while (Math.Abs(incrementMinutes) > 0)
        {
            // If we're on a non-workday, skip to the next workday
            if (IsWeekend(result) || IsHoliday(result))
            {
                result = result.AddDays(incrementInWorkdays > 0 ? 1 : -1);
                continue;
            }

            var startOfDay = new DateTime(result.Year, result.Month, result.Day, startHours, startMinutes, 0);
            var endOfDay = new DateTime(result.Year, result.Month, result.Day, stopHours, stopMinutes, 0);

            // Before start going forward, or after end going backward → clamp into the workday
            if (incrementInWorkdays > 0 && result < startOfDay)
            {
                result = startOfDay;
                continue;
            }
            if (incrementInWorkdays < 0 && result > endOfDay)
            {
                result = endOfDay;
                continue;
            }

            // At/past end going forward, or at/before start going backward → roll to the next/prev workday
            if (incrementInWorkdays > 0 && result >= endOfDay)
            {
                result = startOfDay.AddDays(1);
                continue;
            }
            if (incrementInWorkdays < 0 && result <= startOfDay)
            {
                result = endOfDay.AddDays(-1);
                continue;
            }

            // Calculate how many hours and minutes we can add on this day
            int minutesToAdd;

            // If a full workday can be added, add it and move to the next day
            int available = MinutesAvailableToday(result, incrementInWorkdays > 0);
            if (Math.Abs(incrementMinutes) >= available)
            {
                minutesToAdd = available * (incrementInWorkdays > 0 ? 1 : -1);
            }
            else
            {
                // Otherwise, add the remaining minutes and break the loop
                minutesToAdd = incrementMinutes;
            }

            // Add the hours and minutes to the result
            result = result.AddMinutes(minutesToAdd);

            // Subtract the added hours and minutes from the increment
            incrementMinutes -= minutesToAdd;
        }

        return result;
    }

    int MinutesAvailableToday(DateTime date, bool forward)
    {
        var startOfDay = new DateTime(date.Year, date.Month, date.Day, startHours, startMinutes, 0);
        var endOfDay = new DateTime(date.Year, date.Month, date.Day, stopHours, stopMinutes, 0);

        if (date <= startOfDay) return forward ? GetWorkdayDuration() : 0;
        if (date >= endOfDay) return forward ? 0 : GetWorkdayDuration();

        return forward
            ? (int)(endOfDay - date).TotalMinutes
            : (int)(date - startOfDay).TotalMinutes;
    }

    int GetWorkdayDuration()
    {
        int workdayHours = stopHours - startHours;
        int workdayMinutes;
        if (stopMinutes < startMinutes)
        {
            workdayHours--;
            workdayMinutes = stopMinutes + 60 - startMinutes;
        }
        else
        {
            workdayMinutes = stopMinutes - startMinutes;
        }

        return workdayMinutes + workdayHours * 60;
    }

    int GetIncrementDuration(decimal incrementInWorkdays, int workdayMinutes)
    {
        int totalMinutes = (int)(incrementInWorkdays * workdayMinutes);
        return totalMinutes;
    }

    bool IsWeekend(DateTime date)
    {
        return date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday;
    }

    bool IsHoliday(DateTime date)
    {
        return holidays.Any(h => h.Date == date.Date) || recurringHolidays.Any(h => h.Day == date.Day && h.Month == date.Month);
    }
}
