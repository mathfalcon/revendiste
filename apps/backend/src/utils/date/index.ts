import {TZDate} from '@date-fns/tz';
import {isPast, setYear} from 'date-fns';
import {es} from 'date-fns/locale';

export class DateUtils {
  static fromSpanishStrings(args: {
    dayString: string;
    monthString: string;
    hour: string;
    minutes: string;
    timezone: string;
  }) {
    const day = parseInt(args.dayString);
    const monthMatch = es.match.month(args.monthString);
    const year = new Date().getFullYear();
    const hour = parseInt(args.hour);
    const minutes = parseInt(args.minutes);

    if (typeof monthMatch?.value !== 'number') {
      throw new Error(`Invalid month: ${args.monthString}`);
    }

    const date = new TZDate(year, monthMatch?.value, day, args.timezone);

    date.setHours(hour, minutes, 0, 0);

    return date;
  }

  static fixNextYearEdgeCase(startDate: Date, endDate: Date) {
    const eventIsNextYear = isPast(startDate) && isPast(endDate);
    if (eventIsNextYear) {
      startDate = setYear(startDate, new Date().getFullYear() + 1);
      endDate = setYear(endDate, new Date().getFullYear() + 1);
    }

    return {startDate, endDate};
  }
}
