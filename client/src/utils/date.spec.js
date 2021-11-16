import * as date from './date'

describe('date utils', () => {
  describe('dateNow', () => {
    it('should be the current date', () => {
      const val = date.dateNow;
      const compare = new Date();
      expect(val.getFullYear()).toEqual(compare.getFullYear())
      expect(val.getMonth()).toEqual(compare.getMonth())
      expect(val.getDate()).toEqual(compare.getDate())
      expect(val.getHours()).toEqual(compare.getHours())
    })
  })

  describe('getPreviousDate()', () => {
    it('should be the previous date', () => {
      const val = date.getPreviousDate();
      const compare = new Date();
      expect(val.getFullYear()).toEqual(compare.getFullYear())
      expect(val.getMonth()).toEqual(compare.getMonth())
      expect(val.getDate()).toEqual(compare.getDate() - 1)
      expect(val.getHours()).toEqual(compare.getHours())
    })
  })

  describe('getMonth()', () => {
    it('should get janv, case val is 1', () => {
      const val = date.getMonth(1);
      expect(val).toEqual('Jan.');
    })
    it('should get NC, case val is not defined', () => {
      const val = date.getMonth();
      expect(val).toEqual('NC');
    })
  })

  describe('dateFormatToText()', () => {
    it('should return a blank string if date is undefined', () => {
      const val = date.dateFormatToText();
      expect(val).toEqual('');
    })

    it('should return a formated string date if date is correct', () => {
      const val = date.dateFormatToText('1/1/1999');
      expect(val).toEqual('1 Jan. 1999');
    })

    it('should return a formated string date if date is correct', () => {
      const val = date.dateFormatToText('1/1');
      const year = new Date().getFullYear();
      expect(val).toEqual(`1 Jan. ${year}`);
    })

    it('should return a blank string if date is NOT correct', () => {
      const val = date.dateFormatToText('1');
      expect(val).toEqual('');
    })

    it('should return a formated string if date is partially correct', () => {
      const val = date.dateFormatToText('1/20');
      const year = new Date().getFullYear();
      expect(val).toEqual(`1 NC ${year}`);
    })
  })
})
