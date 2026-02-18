export const dateFormatToText = (date: string | undefined = ''): string => {
  if (!date.length) return date;

  const dateToFormat = new Date(date);
  const isInvalidDate = Number.isNaN(dateToFormat.getMonth());
  if (isInvalidDate) return '';

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(dateToFormat);
};

export const dateFormatToIsoString = (date: string): string => (date ? new Date(date.split("/").reverse().join("-")).toISOString() : '');

export const getStringDate = (date: string | Date | undefined): string => {
  if (typeof date === 'string') return date;
  else if (typeof date === 'object') return date.toDateString();
  else return `${date}`;
};
