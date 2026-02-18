export const getMonth = (month: number | undefined): string => {
  if (month === 1) return 'Jan.';
  if (month === 2) return 'Fév.';
  if (month === 3) return 'Mars';
  if (month === 4) return 'Avr.';
  if (month === 5) return 'Mai.';
  if (month === 6) return 'Juin.';
  if (month === 7) return 'Juil.';
  if (month === 8) return 'Aou.';
  if (month === 9) return 'Sep.';
  if (month === 10) return 'Oct.';
  if (month === 11) return 'Nov.';
  if (month === 12) return 'Déc.';
  return 'NC';
};

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
