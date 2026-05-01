using System.Globalization;
using WorkdayNet;
using Xunit;

namespace WorkdayNet.Tests;

public class GetWorkdayIncrementTests
{
    private const string Format = "dd-MM-yyyy HH:mm";

    private static IWorkdayCalendar BuildSpecCalendar()
    {
        IWorkdayCalendar calendar = new WorkdayCalendar();
        calendar.SetWorkdayStartAndStop(8, 0, 16, 0);
        calendar.SetRecurringHoliday(5, 17);
        calendar.SetHoliday(new DateTime(2004, 5, 27));
        return calendar;
    }

    private static DateTime ParseDate(string s) =>
        DateTime.ParseExact(s, Format, CultureInfo.InvariantCulture);

    // Cases from the spec PDF.
    [Theory]
    [InlineData("24-05-2004 18:05", -5.5,        "14-05-2004 12:00")]
    [InlineData("24-05-2004 19:03",  44.723656,  "27-07-2004 13:47")]
    [InlineData("24-05-2004 18:03", -6.7470217,  "13-05-2004 10:02")]
    [InlineData("24-05-2004 08:03",  12.782709,  "10-06-2004 14:18")]
    [InlineData("24-05-2004 07:03",  8.276628,   "04-06-2004 10:12")]
    public void GetWorkdayIncrement_SpecCases_ReturnsExpected(
        string startStr, decimal increment, string expectedStr)
    {
        var calendar = BuildSpecCalendar();
        var start = ParseDate(startStr);
        var expected = ParseDate(expectedStr);

        var actual = calendar.GetWorkdayIncrement(start, increment);

        Assert.Equal(expected, new DateTime(
            actual.Year, actual.Month, actual.Day,
            actual.Hour, actual.Minute, 0));
    }

    // From spec text: "if business hours are 8 to 16, 15:07 + 0.25 work days
    // will be 09:07, and 04:00 + 0.5 work days will be 12:00."
    [Fact]
    public void FractionalIncrement_RollsToNextWorkday()
    {
        IWorkdayCalendar calendar = new WorkdayCalendar();
        calendar.SetWorkdayStartAndStop(8, 0, 16, 0);

        // Monday 15:07 + 0.25 workday (= 2h) -> Tuesday 09:07
        var start = new DateTime(2004, 5, 24, 15, 7, 0);
        var result = calendar.GetWorkdayIncrement(start, 0.25m);

        Assert.Equal(new DateTime(2004, 5, 25, 9, 7, 0), result);
    }

    [Fact]
    public void StartBeforeBusinessHours_ClampsToStart()
    {
        IWorkdayCalendar calendar = new WorkdayCalendar();
        calendar.SetWorkdayStartAndStop(8, 0, 16, 0);

        // 04:00 + 0.5 workday (= 4h) starting from 08:00 -> 12:00 same day
        var start = new DateTime(2004, 5, 24, 4, 0, 0);
        var result = calendar.GetWorkdayIncrement(start, 0.5m);

        Assert.Equal(new DateTime(2004, 5, 24, 12, 0, 0), result);
    }

    [Fact]
    public void ZeroIncrement_ReturnsDateInsideBusinessHours()
    {
        IWorkdayCalendar calendar = new WorkdayCalendar();
        calendar.SetWorkdayStartAndStop(8, 0, 16, 0);

        var start = new DateTime(2004, 5, 24, 10, 30, 0); // Monday, in hours
        var result = calendar.GetWorkdayIncrement(start, 0m);

        Assert.InRange(result.TimeOfDay, TimeSpan.FromHours(8), TimeSpan.FromHours(16));
        Assert.NotEqual(DayOfWeek.Saturday, result.DayOfWeek);
        Assert.NotEqual(DayOfWeek.Sunday, result.DayOfWeek);
    }

    [Fact]
    public void IncrementSkipsWeekend()
    {
        IWorkdayCalendar calendar = new WorkdayCalendar();
        calendar.SetWorkdayStartAndStop(8, 0, 16, 0);

        // Friday 2004-05-21 09:00 + 1 workday -> Monday 2004-05-24 09:00
        var friday = new DateTime(2004, 5, 21, 9, 0, 0);
        var result = calendar.GetWorkdayIncrement(friday, 1m);

        Assert.Equal(new DateTime(2004, 5, 24, 9, 0, 0), result);
    }

    [Fact]
    public void IncrementSkipsRecurringHoliday()
    {
        IWorkdayCalendar calendar = new WorkdayCalendar();
        calendar.SetWorkdayStartAndStop(8, 0, 16, 0);
        calendar.SetRecurringHoliday(5, 17); // Mon 2004-05-17

        // Friday 2004-05-14 09:00 + 1 workday should skip Mon May 17 -> Tue May 18 09:00
        var friday = new DateTime(2004, 5, 14, 9, 0, 0);
        var result = calendar.GetWorkdayIncrement(friday, 1m);

        Assert.Equal(new DateTime(2004, 5, 18, 9, 0, 0), result);
    }

    [Fact]
    public void IncrementSkipsOneOffHoliday()
    {
        IWorkdayCalendar calendar = new WorkdayCalendar();
        calendar.SetWorkdayStartAndStop(8, 0, 16, 0);
        calendar.SetHoliday(new DateTime(2004, 5, 27)); // Thu

        // Wed 2004-05-26 09:00 + 1 workday should skip Thu May 27 -> Fri May 28 09:00
        var wed = new DateTime(2004, 5, 26, 9, 0, 0);
        var result = calendar.GetWorkdayIncrement(wed, 1m);

        Assert.Equal(new DateTime(2004, 5, 28, 9, 0, 0), result);
    }

    [Fact]
    public void NegativeIncrementSkipsWeekend()
    {
        IWorkdayCalendar calendar = new WorkdayCalendar();
        calendar.SetWorkdayStartAndStop(8, 0, 16, 0);

        // Monday 2004-05-24 09:00 - 1 workday -> Friday 2004-05-21 09:00
        var monday = new DateTime(2004, 5, 24, 9, 0, 0);
        var result = calendar.GetWorkdayIncrement(monday, -1m);

        Assert.Equal(new DateTime(2004, 5, 21, 9, 0, 0), result);
    }
}
