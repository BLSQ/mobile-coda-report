import { chain, sortBy } from 'lodash';
import Entity from './entity/Entity';
import Form from './entity/Form';
import { dateFromJson } from './utils/DateFormatter';
import { countryConfig } from './config/country';
//import FAKE_DATA from './fake/FakeData';
//import FAKE_LOCAL_HF from './fake/FakeLocalHealthFacility';
//import FAKE_SCREENING_DATA from './fake/FakeScreeningData';

const SCREENING = 'SCREENING';
const STOCK = 'STOCK';
const SCREENING_TALLY_FORM = 'screening_tally';

// Form values holding the org unit a submission was made for, when it isn't
// the org unit the submission is attached to.
const ORG_UNIT_VALUE_FIELDS = [
    'org_unit_id',
    'current_ou_id',
    '_ou_id',
    'parent1_ou_id',
    'parent2_ou_id',
    'parent3_ou_id',
];

interface LoadedForms {
    forms: Array<Form>;
    entities: Array<Entity>;
}

const toForm = (form: any): Form => {
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
};

// Every row as a Form, chronologically sorted.
const toSortedForms = (rows: any[]): Array<Form> => {
    return sortBy(rows.map(toForm), 'createdAt');
};

const isAtHealthFacility = (row: any, healthFacilityId: string): boolean => {
    return (
        row?.orgUnitId === healthFacilityId ||
        ORG_UNIT_VALUE_FIELDS.some(
            field => row?.values?.[field] === healthFacilityId,
        )
    );
};

const toEntities = (rows: any[], healthFacilityId: string): Array<Entity> => {
    return (
        chain(rows)
            // Rows not tied to a beneficiary (e.g. stock reports) would otherwise
            // be grouped into a single profile-less "undefined" entity.
            .filter(row => row.entityId != null)
            .groupBy(row => row.entityId)
            .map((entityRows: Array<any>, entityId): Entity => {
                const profile = entityRows.find(row => row.id === entityId);
                return {
                    id: entityId,
                    entityTypeId: entityRows[0].entityTypeId,
                    entityTypeName: entityRows[0].entityTypeName,
                    profile: profile && toForm(profile),
                    visits: toSortedForms(
                        entityRows.filter(
                            row =>
                                row.id !== entityId &&
                                isAtHealthFacility(row, healthFacilityId),
                        ),
                    ),
                };
            })
            .value()
    );
};

let lastRequestId = 0;
const loadForms = (
    orgUnits: string | null,
    entityTypes: string | null,
    forms: string[] | null,
): Promise<any[]> => {
    return new Promise(resolve => {
        lastRequestId += 1;
        const requestId = lastRequestId;
        function onMessage(ev: MessageEvent) {
            const payload = JSON.parse(ev.data);
            // We receive a string and compare it with a number, so eqeqeq is
            // deliberately relaxed here.
            // eslint-disable-next-line eqeqeq
            if (!payload || payload.id != requestId) {
                return;
            }
            window.removeEventListener('message', onMessage);
            resolve(Array.isArray(payload.data) ? payload.data : []);
        }
        window.addEventListener('message', onMessage);

        // @ts-ignore Android is injected globally by the native WebView bridge
        Android.loadForms(
            orgUnits,
            entityTypes,
            null,
            null,
            forms?.join(',') ?? null,
            null,
            requestId,
        );
        // Fake data (local dev): replace the Android.loadForms() call above by
        // const rows = [
        //     ...JSON.parse(FAKE_DATA),
        //     ...JSON.parse(FAKE_SCREENING_DATA),
        // ].filter((row: any) =>
        //     forms
        //         ? forms.includes(row?.formFormId)
        //         : row?.entityTypeName === entityTypes,
        // );
        // window.postMessage(JSON.stringify({ id: requestId, data: rows }), '*');
    });
};

const loadScreeningRows = async (healthFacilityId: string): Promise<any[]> => {
    const tallyForms = countryConfig.screeningForms.filter(
        form => form === SCREENING_TALLY_FORM,
    );
    const visitForms = countryConfig.screeningForms.filter(
        form => form !== SCREENING_TALLY_FORM,
    );
    const tallyRows = tallyForms.length
        ? await loadForms(null, null, tallyForms)
        : [];
    const visitRows = visitForms.length
        ? await loadForms(healthFacilityId, null, visitForms)
        : [];
    return [...tallyRows, ...visitRows].filter(
        row =>
            row?.parentOrgUnitId === healthFacilityId ||
            isAtHealthFacility(row, healthFacilityId),
    );
};

const loadEntityTypeForms = async (
    entityTypeName: string,
): Promise<LoadedForms> => {
    // @ts-ignore Android is injected globally by the native WebView bridge
    const healthFacilityId: string = JSON.parse(Android.currentOrgUnit()).id;
    //const healthFacilityId: string = JSON.parse(FAKE_LOCAL_HF).id;
    if (entityTypeName === SCREENING) {
        const rows = await loadScreeningRows(healthFacilityId);
        return { forms: toSortedForms(rows), entities: [] };
    }
    const rows =
        entityTypeName === STOCK
            ? await loadForms(healthFacilityId, null, countryConfig.stockForms)
            : await loadForms(healthFacilityId, entityTypeName, null);
    return {
        forms: toSortedForms(rows),
        entities: toEntities(rows, healthFacilityId),
    };
};

const LoadFormsForEntityType = (
    entityTypeName: string | null,
    callback: (result: LoadedForms) => void,
): void => {
    if (entityTypeName == null) {
        callback({ forms: [], entities: [] });
        return;
    }
    loadEntityTypeForms(entityTypeName).then(callback);
};

export default LoadFormsForEntityType;
