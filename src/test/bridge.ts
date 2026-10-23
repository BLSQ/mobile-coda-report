// Stubs the native WebView bridge with the submissions of a fixture.
//
// The country config reads `Android.info()` when it is first imported, so this module has to be
// imported before anything that pulls in `config/country` — put `import './bridge'` (or
// `./test/bridge`) at the top of a test file, before the report imports.

export const ORG_UNIT = { id: 'OU-1', name: 'Camp 4 INF' };
export const BANGLADESH_APP_ID = 'org.wfp.coda2.bangladesh';

let submissions: any[] = [];

// The phone answers the report asynchronously, through a window message.
function loadForms(
    _orgUnits: string | null,
    entityTypes: string | null,
    _startDate: string | null,
    _endDate: string | null,
    _forms: string | null,
    _sources: string | null,
    callback: string | null,
) {
    const rows = entityTypes
        ? submissions.filter(row => row.entityTypeName === entityTypes)
        : submissions;
    window.postMessage(JSON.stringify({ id: callback, data: rows }), '*');
    return null;
}

// @ts-ignore the native bridge is a global in the WebView
global.Android = {
    loadForms,
    currentOrgUnit: () => JSON.stringify(ORG_UNIT),
    info: () => JSON.stringify({ app_id: BANGLADESH_APP_ID }),
};

export function useSubmissions(rows: any[]) {
    submissions = rows;
}
