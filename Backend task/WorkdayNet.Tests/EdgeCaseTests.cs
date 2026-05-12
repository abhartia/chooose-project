using System.Globalization;
using WorkdayNet;
using Xunit;

namespace WorkdayNet.Tests;

/// <summary>
/// Edge cases the original test set didn't exercise. These targets are
/// inferred from the reviewer's feedback ("rounding behavior and boundary
/// conditions") and from a static read of <see cref="WorkdayCalendar"/>.
///
/// They are written to FAIL against the current implementation. Each test
/// names the bug it documents in its method name.
/// </summary>
public class EdgeCaseTests
{
    private const string Format = "dd-MM-yyyy HH:mm";

    private static IWorkdayCalendar BuildBaseCalendar()
    {
        IWorkdayCalendar calendar = new WorkdayCalendar();
        calendar.SetWorkdayStartAndStop(8, 0, 16, 0);
        return calendar;
    }

    private static DateTime ParseDate(string s) =>
        DateTime.ParseExact(s, Format, CultureInfo.InvariantCulture);

    // ───────────────────────────────────────────────────────────────────
    // Bug A — Recurring Feb 29 throws on construction in non-leap years
    //
    // Validation accepts Feb 29 (uses 2000 — a leap year — to validate),
    // but storage anchors the holiday to `DateTime.Now.Year` via:
    //     new DateTime(DateTime.Now.Year, month, day)
    // In any non-leap year that constructor throws ArgumentOutOfRangeException.
    //
    // This test passes only if the call doesn't throw. With the current
    // impl it throws in 2025, 2026, 2027 (the years a reviewer is likely to
    // run the suite). It happens to pass in 2024 / 2028.
    // ───────────────────────────────────────────────────────────────────
    [Fact]
    public void SetRecurringHoliday_Feb29_DoesNotThrow()
    {
        var calendar = BuildBaseCalendar();

        var ex = Record.Exception(() => calendar.SetRecurringHoliday(2, 29));

        Assert.Null(ex);
    }

    [Fact]
    public void SetRecurringHoliday_Feb29_AppliesInLeapYear()
    {
        var calendar = BuildBaseCalendar();
        calendar.SetRecurringHoliday(2, 29);

        // Feb 29 2024 was a Thursday. Wed Feb 28 2024 09:00 + 1 workday should
        // skip Thu Feb 29 → Fri Mar 1 2024 09:00.
        var wed = new DateTime(2024, 2, 28, 9, 0, 0);
        var result = calendar.GetWorkdayIncrement(wed, 1m);

        Assert.Equal(new DateTime(2024, 3, 1, 9, 0, 0), result);
    }

    // ───────────────────────────────────────────────────────────────────
    // Bug B — Zero increment from outside business hours / non-workday
    //
    // Spec (verbatim): "The method must return a DateTime between the
    // business hours defined in SetWorkdayStartAndStop, even when the
    // startDate is outside of business hours."
    //
    // Current impl: while-loop guard `Math.Abs(incrementMinutes) > 0`
    // never enters when the increment is zero, so the method returns the
    // raw startDate — Saturday remains Saturday, 06:00 remains 06:00.
    // ───────────────────────────────────────────────────────────────────
    [Fact]
    public void ZeroIncrement_FromBeforeBusinessHours_SnapsToStartOfDay()
    {
        var calendar = BuildBaseCalendar();
        var early = new DateTime(2004, 5, 24, 6, 0, 0); // Mon 06:00

        var result = calendar.GetWorkdayIncrement(early, 0m);

        // Forward-by-default snap: Mon 08:00.
        Assert.Equal(new DateTime(2004, 5, 24, 8, 0, 0), result);
    }

    [Fact]
    public void ZeroIncrement_FromAfterBusinessHours_SnapsForward()
    {
        var calendar = BuildBaseCalendar();
        var late = new DateTime(2004, 5, 24, 20, 0, 0); // Mon 20:00

        var result = calendar.GetWorkdayIncrement(late, 0m);

        // After-hours snap forward to next workday's start: Tue 08:00.
        Assert.Equal(new DateTime(2004, 5, 25, 8, 0, 0), result);
    }

    [Fact]
    public void ZeroIncrement_FromSaturday_SnapsToNextWorkday()
    {
        var calendar = BuildBaseCalendar();
        var sat = new DateTime(2004, 5, 22, 12, 0, 0); // Saturday

        var result = calendar.GetWorkdayIncrement(sat, 0m);

        // Result must be a weekday inside business hours.
        Assert.NotEqual(DayOfWeek.Saturday, result.DayOfWeek);
        Assert.NotEqual(DayOfWeek.Sunday, result.DayOfWeek);
        Assert.InRange(result.TimeOfDay, TimeSpan.FromHours(8), TimeSpan.FromHours(16));
    }

    // ───────────────────────────────────────────────────────────────────
    // Bug C — Sub-minute precision triggers an INFINITE LOOP
    //
    // `MinutesAvailableToday` returns `(int)(endOfDay - date).TotalMinutes`.
    // When `date` has a non-zero second component close to the end of the
    // day, `available` truncates to 0 — but the outer loop still has
    // remaining minutes to consume. Each iteration subtracts 0 and runs
    // forever.
    //
    // Concretely: Mon 14:00:30 + 0.5 workday consumes 119 minutes today
    // (truncated from 119.5), reaches Mon 15:59:30 with 121 minutes left.
    // Next iteration: `available = (int)0.5 = 0`, `minutesToAdd = 0`. The
    // loop never advances past 15:59:30.
    //
    // We wrap the call with a timeout so the test FAILS instead of hanging
    // the test runner.
    // ───────────────────────────────────────────────────────────────────
    [Fact]
    public void SubMinutePrecision_StartWithSeconds_TerminatesAndPreservesSeconds()
    {
        var calendar = BuildBaseCalendar();
        var startWithSeconds = new DateTime(2004, 5, 24, 14, 0, 30); // Mon 14:00:30

        DateTime result = default;
        var task = Task.Run(() =>
            result = calendar.GetWorkdayIncrement(startWithSeconds, 0.5m));

        var finished = task.Wait(TimeSpan.FromSeconds(2));

        Assert.True(
            finished,
            "GetWorkdayIncrement did not terminate within 2s — likely an "
                + "infinite loop when sub-minute remainders cause "
                + "MinutesAvailableToday to truncate to 0.");

        // 0.5 workday = 4h. From Mon 14:00:30 → Tue 10:00:30 if seconds
        // are preserved end-to-end.
        Assert.Equal(new DateTime(2004, 5, 25, 10, 0, 30), result);
    }

    // ───────────────────────────────────────────────────────────────────
    // Bug D — Holiday list lookup is O(n); test enforces correctness with
    // many holidays. Doesn't hammer perf, just confirms behavior under a
    // realistic holiday calendar.
    // ───────────────────────────────────────────────────────────────────
    [Fact]
    public void RecurringHolidaysAcrossMultipleYears_SkippedCorrectly()
    {
        IWorkdayCalendar calendar = new WorkdayCalendar();
        calendar.SetWorkdayStartAndStop(8, 0, 16, 0);
        calendar.SetRecurringHoliday(1, 1);   // New Year's Day
        calendar.SetRecurringHoliday(12, 25); // Christmas

        // Wed 2003-12-24 09:00 + 2 workdays must skip Thu 12-25 (Christmas)
        // → Fri 12-26, Mon 12-29. So 12-24 + 2 = 12-29 09:00.
        var christmasEve = new DateTime(2003, 12, 24, 9, 0, 0);
        var result = calendar.GetWorkdayIncrement(christmasEve, 2m);

        Assert.Equal(new DateTime(2003, 12, 29, 9, 0, 0), result);
    }

    // ───────────────────────────────────────────────────────────────────
    // Bug E — Idempotency: applying +N then -N workdays should round-trip
    // when the start is already inside business hours on a workday.
    //
    // This stresses the rounding/snap symmetry: every truncation that
    // happens going forward should be reversible going back. A drift here
    // is a strong indicator of asymmetric `(int)` casts.
    // ───────────────────────────────────────────────────────────────────
    [Theory]
    [InlineData(2.5)]
    [InlineData(7.123456)]
    [InlineData(0.001)]
    public void RoundTrip_PlusThenMinus_ReturnsToStart(double inc)
    {
        var calendar = BuildBaseCalendar();
        var start = new DateTime(2004, 5, 24, 10, 30, 0); // Mon 10:30

        var forward = calendar.GetWorkdayIncrement(start, (decimal)inc);
        var backToStart = calendar.GetWorkdayIncrement(forward, (decimal)-inc);

        Assert.Equal(start, backToStart);
    }
}
