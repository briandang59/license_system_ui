import dayjs from "dayjs";

export function formatDateTime(date: string): string {
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
}
