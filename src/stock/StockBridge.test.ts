import { callStockBridge } from './StockBridge';

// Mimics ReportActivity: stock calls read the bridge-wide callback field,
// which only loadForms() writes.
const fakeBridge = () => {
    let callback: string | null = null;
    return {
        loadForms: jest.fn((...args: any[]) => {
            callback = args[6];
            return callback == null ? '[]' : null;
        }),
        getStockValueAt: jest.fn(() =>
            callback == null ? '{"Oil":3}' : undefined,
        ),
    };
};

describe('callStockBridge', () => {
    afterEach(() => {
        delete (global as any).Android;
    });

    it('answers synchronously even after loadForms() was called with a callback', () => {
        const bridge = fakeBridge();
        (global as any).Android = bridge;
        bridge.loadForms('5846', 'STOCK', null, null, null, null, '42');

        expect(
            callStockBridge('5846', () => bridge.getStockValueAt() as string),
        ).toEqual({ Oil: 3 });
        expect(bridge.loadForms).toHaveBeenLastCalledWith(
            '5846',
            null,
            null,
            null,
            '__reset_report_callback__',
            null,
            null,
        );
    });

    it('throws when the bridge still returns no value', () => {
        (global as any).Android = { loadForms: () => '[]' };
        expect(() => callStockBridge('5846', () => undefined as any)).toThrow();
    });
});
