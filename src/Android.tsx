import { chain } from 'lodash';
import Entity from './entity/Entity';
import Form from './entity/Form';
import { dateFromJson } from './utils/DateFormatter';
import { countryConfig } from './config/country';
//import FAKE_DATA from './fake/FakeData';
//import FAKE_LOCAL_HF from './fake/FakeLocalHealthFacility';

function toForm(form: any): Form {
    return {
        id: form.id,
        formId: form.formId,
        formFormId: form.formFormId,
        formName: form.formName,
        orgUnitId: form.orgUnitId,
        orgUnitName: form.orgUnitName,
        parentOrgUnitId: form.parentOrgUnitId,
        periodId: form.periodId,
        createdAt: dateFromJson(form.createdAt),
        updatedAt: dateFromJson(form.updatedAt),
        values: form.values,
    } as Form;
}

interface LoadedForms {
    // Every submission the bridge returned for this entity type, flat and
    // unfiltered — reports that don't fit the "beneficiary with visits"
    // shape (e.g. Screening's tally forms) read from this directly instead
    // of from `entities`.
    forms: Array<Form>;
    // The same submissions grouped by entityId into beneficiary profiles
    // with their visits, for reports built around a beneficiary.
    entities: Array<Entity>;
}

// Screening's tally forms aren't tied to a beneficiary entity, so they're
// requested and returned as a flat, chronologically sorted list rather than
// grouped into entities.
function toFlatForms(rows: any[]): Array<Form> {
    return chain(rows)
        .map(row => toForm(row))
        .sortBy('createdAt')
        .value();
}

function toEntities(rows: any[], localHealthFacilityId: string): Array<Entity> {
    console.info('SDSD ...:', localHealthFacilityId);
    return chain(rows)
        .groupBy(row => row.entityId)
        .map((entityRows: Array<any>, key) => {
            return {
                id: key as string,
                entityTypeId: entityRows[0].entityTypeId,
                entityTypeName: entityRows[0].entityTypeName,
                profile: chain(entityRows)
                    .filter(row => row.id === key)
                    .map(row => toForm(row))
                    .value()[0],
                visits: chain(entityRows)
                    .filter(
                        row =>
                            row.id !== key &&
                            (row.orgUnitId === localHealthFacilityId ||
                                row?.values?.org_unit_id ===
                                    localHealthFacilityId ||
                                row?.values?.current_ou_id ===
                                    localHealthFacilityId ||
                                row?.values?._ou_id === localHealthFacilityId),
                    )
                    .map(row => toForm(row))
                    .sort((f1: Form, f2: Form) => {
                        if (f1.createdAt < f2.createdAt) {
                            return -1;
                        }
                        if (f1.createdAt > f2.createdAt) {
                            return 1;
                        }
                        return 0;
                    })
                    .value(),
            } as Entity;
        })
        .value();
}

// Loads only the submissions relevant to one beneficiary type at a time,
// scoping the native bridge call to it so the device doesn't have to ship
// every form on every request. Screening is the one exception: its tally
// forms aren't scoped to a single org unit on the native side, so they're
// requested across every org unit and filtered down to this health
// facility once the response comes back.
function LoadFormsForEntityType(
    entityTypeName: string | null,
    callback: (result: LoadedForms) => void,
): void {
    if (entityTypeName == null) {
        callback({ forms: [], entities: [] });
        return;
    }

    // @ts-ignore Android is injected globally by the native WebView bridge
    const localHealthFacility = JSON.parse(Android.currentOrgUnit());
    //const localHealthFacility = JSON.parse(FAKE_LOCAL_HF);

    const requestId = Math.floor(Math.random() * 1000);
    const isScreening = entityTypeName === 'SCREENING';

    function onMessage(ev: MessageEvent) {
        const payload = JSON.parse(ev.data);
        console.info('PAYLOAD ...:', payload);
        // We receive a string and compare it with a number, so eqeqeq is
        // deliberately relaxed here.
        // eslint-disable-next-line eqeqeq
        if (!payload || payload.id != requestId) {
            return;
        }
        window.removeEventListener('message', onMessage);

        if (isScreening) {
            const rows = Array.isArray(payload?.data)
                ? payload.data.filter(
                      (row: any) =>
                          row?.parentOrgUnitId === localHealthFacility.id ||
                          row?.orgUnitId === localHealthFacility.id,
                  )
                : [];

            callback({ forms: toFlatForms(rows), entities: [] });
        } else {
            const rows = payload?.data ?? [];
            console.info('EACH ROWS ...:', rows);
            callback({
                forms: toFlatForms(rows),
                entities: toEntities(rows, localHealthFacility.id),
            });
        }
    }
    window.addEventListener('message', onMessage);

    // @ts-ignore Android is injected globally by the native WebView bridge
    Android.loadForms(
        // Screening tally forms aren't scoped by org unit on the native
        // side, so the org unit filter is left out and applied client-side
        // instead once the data comes back.
        isScreening ? null : localHealthFacility.id,
        isScreening ? null : entityTypeName,
        null,
        null,
        isScreening ? countryConfig.screeningForms.join(',') : null,
        null,
        requestId,
    );
    // let formsData = JSON.parse(FAKE_DATA).filter(
    //     (form: any) => form?.entityTypeName === entityTypeName,
    // );
    // console.info('FORMS DATA ...:', formsData);
    // window.postMessage(JSON.stringify({ id: requestId, data: formsData }), '*');
}

export default LoadFormsForEntityType;
