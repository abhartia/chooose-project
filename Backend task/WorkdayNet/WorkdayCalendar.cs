namespace WorkdayNet;

public class WorkdayCalendar : IWorkdayCalendar
{
    List<DateTime> holidays = new List<DateTime>();
    List<DateTime> recurringHolidays = new List<DateTime>();
    int startHours = 9;
    int startMinutes = 0;
    int stopHours = 17;
    int stopMinutes = 0;

    public void SetHoliday(DateTime date)
    {
        holidays.Add(date);
    }

    public void SetRecurringHoliday(int month, int day)
    {
        recurringHolidays.Add(new DateTime(DateTime.Now.Year, month, day));
    }

    public void SetWorkdayStartAndStop(int startHours, int startMinutes, int stopHours, int stopMinutes)
    {
        this.startHours = startHours;
        this.startMinutes = startMinutes;
        this.stopHours = stopHours;
        this.stopMinutes = stopMinutes;
    }

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
