import { startOfISOWeek } from 'date-fns/startOfISOWeek';

const dateFromJson = (value: string) => {
    const date = new Date();
    date.setTime(Date.parse(value));
    return date;
};

const removeTime = (date?: Date | string): Date => {
    let dateToTransform: Date;
    if (date != null) {
        if (typeof date == 'string') {
            dateToTransform = dateFromJson(date);
        } else {
            dateToTransform = date;
        }
    } else {
        dateToTransform = new Date();
    }
    dateToTransform.setHours(0);
    dateToTransform.setMinutes(0);
    dateToTransform.setSeconds(0);
    dateToTransform.setMilliseconds(0);
    return dateToTransform;
};

const padMonth = (n: any) => {
    return n < 10 ? '0' + n : n;
};

const timeStampToDate = (value: any) => {
    const date = new Date(value);
    const currentDayOfMonth = padMonth(date.getDate());
    const currentMonth = padMonth(date.getMonth() + 1);
    const currentYear = date.getFullYear();
    if (!currentYear || isNaN(currentYear)) {
        return '';
    } else
        return new Date(
            currentYear + '-' + currentMonth + '-' + currentDayOfMonth,
        )?.toISOString();
};

const timeStampToDateString = (value: any) => {
    const timestampDate = timeStampToDate(value);
    return timestampDate.substring(0, 10);
};

const weekToDateStartMonday = (period: string) => {
    const [yearNumber, weekNumber] = period?.split('W');
    const year = parseInt(yearNumber);
    const week = parseInt(weekNumber);
    const januaryFirstWeek = new Date(Date.UTC(year, 0, 4));
    const isoWeekStart = startOfISOWeek(januaryFirstWeek);
    isoWeekStart.setUTCDate(isoWeekStart.getUTCDate() + (week - 1) * 7);
    return isoWeekStart;
};

const yearMonthToDateFirst = (yearMonth: string) => {
    const year = yearMonth?.slice(0, 4);
    const month = yearMonth?.slice(4);
    return new Date(year + '-' + month + '-01')?.toISOString();
};

export {
    dateFromJson,
    removeTime,
    timeStampToDate,
    timeStampToDateString,
    weekToDateStartMonday,
    yearMonthToDateFirst,
};
