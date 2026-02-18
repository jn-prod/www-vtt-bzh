export const dateFormatToText = (date?: string = ''): string => {
  try {
      return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", }).format(new Date(date));
  } catch {
      return '';
  }
};

export const dateFormatToIsoString = (date: string): string => (date ? new Date(date.split("/").reverse().join("-")).toISOString() : '');

export const getStringDate = (date: string | Date | undefined): string => {
  if (typeof date === 'string') return date;
  else if (typeof date === 'object') return date.toDateString();
  else return `${date}`;
};
