import { toDays } from './Filter';

describe('toDays', () => {
    it.each([
        ['14', 14],
        [7, 7],
        ['', 0],
        [undefined, 0],
        [null, 0],
    ])('reads %p as %p days', (value, days) => {
        expect(toDays(value)).toBe(days);
    });
});
