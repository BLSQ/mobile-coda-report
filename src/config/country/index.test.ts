export {};

// config/country/index.ts resolves its singleton once, at import time, so
// each case below needs a fresh module instance (jest.resetModules) rather
// than re-importing the cached one.
describe('countryConfig resolution from Android.info().app_id', () => {
    const originalAndroid = (global as any).Android;

    afterEach(() => {
        (global as any).Android = originalAndroid;
        jest.resetModules();
    });

    it('picks bangladesh for org.wfp.coda2.bangladesh', () => {
        (global as any).Android = {
            info: () => JSON.stringify({ app_id: 'org.wfp.coda2.bangladesh' }),
        };
        const { countryConfig } = require('./index');
        expect(countryConfig.screeningForms).toEqual(
            require('./bangladesh').default.screeningForms,
        );
    });

    it('picks southSudan for org.bluesquare.coda2', () => {
        (global as any).Android = {
            info: () => JSON.stringify({ app_id: 'org.bluesquare.coda2' }),
        };
        const { countryConfig } = require('./index');
        expect(countryConfig.screeningForms).toEqual(
            require('./southSudan').default.screeningForms,
        );
    });

    it('defaults to southSudan and warns on an unrecognized app_id', () => {
        (global as any).Android = {
            info: () => JSON.stringify({ app_id: 'org.wfp.coda2.nigeria' }),
        };
        const warn = jest.spyOn(console, 'warn').mockImplementation();
        const { countryConfig } = require('./index');
        expect(countryConfig.screeningForms).toEqual(
            require('./southSudan').default.screeningForms,
        );
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it('defaults to southSudan without warning when there is no native bridge', () => {
        delete (global as any).Android;
        const warn = jest.spyOn(console, 'warn').mockImplementation();
        const { countryConfig } = require('./index');
        expect(countryConfig.screeningForms).toEqual(
            require('./southSudan').default.screeningForms,
        );
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });
});
