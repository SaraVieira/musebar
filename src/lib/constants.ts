export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_FILE_SIZE = 30 * 1024 * 1024;

export const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
	["year", 60 * 60 * 24 * 365],
	["month", 60 * 60 * 24 * 30],
	["week", 60 * 60 * 24 * 7],
	["day", 60 * 60 * 24],
	["hour", 60 * 60],
	["minute", 60],
];
