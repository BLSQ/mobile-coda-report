import { CountryConfig } from './types';
import southSudan from './southSudan';
import bangladesh from './bangladesh';
import { callStockBridge } from '../../stock/StockBridge';
//import FAKE_STOCK from '../../fake/FakeStockData';
//import DEFAULT_STOCK from '../../fake/FakeDefaultStockData';

// One native app build == one country, and the native WebView host already
// tells us which one it is via Android.info().app_id (the Gradle flavor's
// application id) — so the country is read from there instead of a build
// step of our own.
const APP_ID_TO_COUNTRY: Record<string, string> = {
    'org.bluesquare.coda2': 'southSudan',
    'org.wfp.coda2.bangladesh': 'bangladesh',
};

const configs: Record<string, CountryConfig> = {
    southSudan,
    bangladesh,
};

const readAppId = (): string | null => {
    try {
        // @ts-ignore Android is injected globally by the native WebView bridge
        const info = JSON.parse(Android.info());
        // const info = JSON.parse(
        //     '{"app_id":"org.wfp.coda2.bangladesh","is_debug":true,"version":2880,"version_name":"2.8.8-39242ad51-BGD-QA"}',
        // );
        return info?.app_id ?? null;
    } catch {
        // No native bridge (local dev/tests outside the WebView) — fall
        return null;
    }
};

const foodInitialStock = (date: string, orgUnitId: string) => {
    try {
        const stocks = callStockBridge<Record<string, number>>(orgUnitId, () =>
            // @ts-ignore Android is injected globally by the native WebView bridge
            Android.getStockValueAt(date, orgUnitId),
        );
        //const stocks = JSON.parse(DEFAULT_STOCK)
        return stocks;
    } catch {
        return null;
    }
};

const appId = readAppId();
let country = appId != null ? APP_ID_TO_COUNTRY[appId] : undefined;
if (appId != null && country == null) {
    // eslint-disable-next-line no-console
    console.warn(
        `Unrecognized Android.info().app_id "${appId}" — defaulting to South Sudan.`,
    );
}
country = country ?? 'southSudan';

export const countryConfig: CountryConfig = configs[country];
export type { CountryConfig, AdmissionTypeMatch } from './types';
export { foodInitialStock };
