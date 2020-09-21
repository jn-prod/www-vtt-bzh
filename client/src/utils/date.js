export const dateNow = new Date(Date.now());

export function dateFormat(date) {
  const day = Number(date.split('/')[0]);
  const month = Number(date.split('/')[1]) - 1;
  const year = Number(date.split('/')[2]);
  return new Date(Date.UTC(year, month, day));
}

export function getMonth(month) {
  let res;
  if (month === 1) {
    res = 'Jan.';
  } if (month === 2) {
    res = 'Fév.';
  } if (month === 3) {
    res = 'Mars';
  } if (month === 4) {
    res = 'Avr.';
  } if (month === 5) {
    res = 'Mai.';
  } if (month === 6) {
    res = 'Juin.';
  } if (month === 7) {
    res = 'Juil.';
  } if (month === 8) {
    res = 'Aou.';
  } if (month === 9) {
    res = 'Sep.';
  } if (month === 10) {
    res = 'Oct.';
  } if (month === 11) {
    res = 'Nov.';
  } if (month === 12) {
    res = 'Déc.';
  }
  return res;
}
