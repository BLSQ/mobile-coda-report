const dateFromJson = (value: string) => {
  const date = new Date();
  date.setTime(Date.parse(value));
  return date;
};

const removeTime = (date: Date): Date => {
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};

const padMonth = (n: any) => {
  return n < 10 ? "0" + n : n;
};

const timeStampToDate = (value: any) => {
  const date = new Date(value);
  const currentDayOfMonth = padMonth(date.getDate());
  const currentMonth = padMonth(date.getMonth() + 1);
  const currentYear = date.getFullYear();
  if (!currentYear || isNaN(currentYear)) {
    return "";
  } else
    return new Date(
      currentYear + "-" + currentMonth + "-" + currentDayOfMonth
    )?.toISOString();
};

const timeStampToDateString = (value: any) => {
  const timestampDate = timeStampToDate(value);
  return timestampDate.substring(0, 10);
};

export { dateFromJson, removeTime, timeStampToDate, timeStampToDateString };