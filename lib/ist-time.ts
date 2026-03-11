const IST_OFFSET_MINUTES = 330;
const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000;

export interface IstDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const pad = (value: number): string => value.toString().padStart(2, "0");

export const toIstShiftedDate = (date: Date): Date => new Date(date.getTime() + IST_OFFSET_MS);

export const fromIstParts = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second = 0,
): Date => new Date(Date.UTC(year, month - 1, day, hour, minute, second) - IST_OFFSET_MS);

export const getIstParts = (date: Date): IstDateParts => {
  const shifted = toIstShiftedDate(date);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
};

export const getIstDateKey = (date: Date): string => {
  const parts = getIstParts(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
};

export const addMinutes = (date: Date, minutes: number): Date => new Date(date.getTime() + minutes * 60 * 1000);

export const toIstLabel = (date: Date): string => {
  const parts = getIstParts(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)} IST`;
};
