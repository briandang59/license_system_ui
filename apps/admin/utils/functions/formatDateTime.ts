import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
export const vietnamTimeZone = "Asia/Ho_Chi_Minh";
export const dateTimeFormat = "DD/MM/YYYY HH:mm";
export const vietnamNow = () => dayjs().tz(vietnamTimeZone);
export const isValidDateTime = (value: unknown): value is Dayjs => dayjs.isDayjs(value) && value.isValid();
export const parseDateTime = (value: string | null | undefined): Dayjs | null => value ? dayjs(value).tz(vietnamTimeZone) : null;

export function pickerToVietnam(value: Dayjs | null): Dayjs | null {
  return value ? dayjs.tz(value.format("YYYY-MM-DD HH:mm:ss.SSS"), vietnamTimeZone) : null;
}

export function formatDateTime(date: string): string {
  return dayjs(date).tz(vietnamTimeZone).format(dateTimeFormat);
}
