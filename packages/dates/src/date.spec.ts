import { describe, expect, test } from 'vitest';
import * as date from './date';

describe('date utils', () => {
  describe('getMonth()', () => {
    test('should get janv, case val is 1', () => {
      const val = date.getMonth(1);
      expect(val).toEqual('Jan.');
    });
    test('should get NC, case val is not defined', () => {
      const val = date.getMonth(undefined);
      expect(val).toEqual('NC');
    });
  });

  describe('dateFormatToText()', () => {
    test('should return a blank string if date is undefined', () => {
      const val = date.dateFormatToText();
      expect(val).toEqual('');
    });

    test('should return a formated string date if date is correct', () => {
      const val = date.dateFormatToText('1999-1-1');
      expect(val).toEqual('1 Jan. 1999');
    });

    test('should return a formated string date if date is correct', () => {
      const val = date.dateFormatToText('2022-06-30');
      expect(val).toEqual(`30 Juin. 2022`);
    });

    test('should return a blank string if date is NOT correct', () => {
      const val = date.dateFormatToText('ab');
      expect(val).toEqual('');
    });
  });
});
