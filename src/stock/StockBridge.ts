// Workaround for the native report bridge (ReportActivity.returnOrCallback):
// getStockValueAt() and loadStockLedgerItems() decide between answering
// synchronously and posting a web message by reading the bridge-wide
// `callback` field instead of their own `callback` argument. That field is
// only ever written by loadForms(), so once a report has loaded its forms
// with a callback id, every later stock call silently goes async, returns
// `undefined` and posts its result under the stale loadForms id nobody
// listens to any more.
//
// loadForms() resets the field to whatever callback it gets, so a no-op
// loadForms() without callback — scoped to a form id that can't exist, so
// the native query stays empty and cheap — puts the bridge back in
// synchronous mode right before the stock call.
//
// Only call this once the forms have been received: resetting the field
// while an async loadForms() is still pending would drop its result.
// TODO: remove once the native bridge passes `callback` to returnOrCallback.
const NO_FORM = '__reset_report_callback__';

const resetBridgeCallback = (orgUnitId: string) => {
    // @ts-ignore Android is injected globally by the native WebView bridge
    Android.loadForms(orgUnitId, null, null, null, NO_FORM, null, null);
};

// Runs a synchronous stock bridge call and parses its JSON answer.
const callStockBridge = <T>(orgUnitId: string, call: () => string): T => {
    resetBridgeCallback(orgUnitId);
    const result = call();
    if (result == null) {
        throw new Error('The stock bridge call returned no value.');
    }
    return JSON.parse(result);
};

export { callStockBridge };
