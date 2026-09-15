import { CountryConfig } from './types';
import southSudan from './southSudan';
import bangladesh from './bangladesh';

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

function readAppId(): string | null {
    try {
        // @ts-ignore Android is injected globally by the native WebView bridge
        const info = JSON.parse(Android.info());
        //const info = JSON.parse('{"app_id":"org.wfp.coda2.bangladesh","is_debug":true,"version":2880,"version_name":"2.8.8-39242ad51-BGD-QA"}')
        console.info("APP INFO ", info);        
        return info?.app_id ?? null;
    } catch {
        // No native bridge (local dev/tests outside the WebView) — fall
        // back below rather than crash the whole app on load.
        return null;
    }
}

const appId = readAppId();
//let country = appId != null ? APP_ID_TO_COUNTRY[appId] : undefined;
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
