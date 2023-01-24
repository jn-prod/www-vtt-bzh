export enum DatePattern {
  DDMMYYYY = 'dd/mm/yyyy',
}

export const getDateFromPattern = (date: string, pattern: DatePattern): Date => {
  const [day, month, year] = date.split('/');
  if (pattern === DatePattern.DDMMYYYY) {
    return new Date(`${year}-${month}-${day}`);
  } else {
    throw new Error('[getDateFromPattern] - Missing Date pattern config.');
  }
};
