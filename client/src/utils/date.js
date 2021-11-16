export const dateNow = new Date();

export const getPreviousDate = () => {
  const date = new Date();
  return new Date(date.setDate(date.getDate() - 1));
};

export const dateFormat = (date) => {
  const day = Number(date.split('/')[0]);
  const month = Number(date.split('/')[1]) - 1;
  const year = Number(date.split('/')[2]);
  return new Date(Date.UTC(year, month, day));
};

export const getMonth = (month) => {
  if (month === 1) {
    return 'Jan.';
  } if (month === 2) {
    return 'Fév.';
  } if (month === 3) {
    return 'Mars';
  } if (month === 4) {
    return 'Avr.';
  } if (month === 5) {
    return 'Mai.';
  } if (month === 6) {
    return 'Juin.';
  } if (month === 7) {
    return 'Juil.';
  } if (month === 8) {
    return 'Aou.';
  } if (month === 9) {
    return 'Sep.';
  } if (month === 10) {
    return 'Oct.';
  } if (month === 11) {
    return 'Nov.';
  } if (month === 12) {
    return 'Déc.';
  }
  return 'NC';
};

export const dateFormatToText = (date) => {
  const defaultValue = '';
  if (!date) return defaultValue;

  const dateElements = date.split('/');

  if (dateElements.length <= 1) {
    return defaultValue;
  }

  const day = dateElements[0];
  const month = getMonth(Number(dateElements[1]));
  const year = dateElements[2] || new Date().getFullYear();
  return `${day} ${month} ${year}`;
};

export const dateFormatToIsoString = (date) => {
  if (!date) return '';

  return dateFormat(date).toISOString();
};
