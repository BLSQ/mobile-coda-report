import { groupBy } from './Array';
import { countryConfig } from '../config/country';

// A visit's ration type, or '' when it records none — forms that share a
// rationGiven list without recording a ration (e.g. anthropometric follow
// ups) must not be counted as a ration of type "undefined".
const rationTypeOf = (visit: any): string =>
    visit?.values?.ration ||
    visit?.values?.ration_type ||
    visit?.values?.ration_type_tsfp ||
    visit?.values?.ration_type_otp ||
    countryConfig.resolveRationType?.(visit?.values) ||
    '';

// The field a ration type's quantity is recorded in.
const rationQuantityField = (ration: string): string => {
    if (['csb', 'csb1', 'csb2'].includes(ration)) {
        return '_csb_packets';
    }
    if (ration === 'lndf') {
        return '_lndf_kgs';
    }
    if (ration === 'wsb') {
        return '_wsb_packets';
    }
    if (ration === 'wsbp') {
        return '_wsbp_packets';
    }
    if (ration === 'cash_voucher') {
        return '_cash_total';
    }
    if (ration === 'in_kind') {
        return 'ration_quantity';
    }
    return '_total_number_of_sachets';
};

// The quantity of ration a visit records in this field. The medical forms
// record theirs in `quantity` instead of the ration type's own field.
const quantityOf = (visit: any, field: string): number => {
    const quantity = parseFloat(
        visit?.values?.[field] ?? visit?.values?.quantity,
    );
    return Number.isNaN(quantity) ? 0 : quantity;
};

// The quantity of ration given at a visit. Some forms (e.g. Bangladesh's
// BSFP) record every ration type's quantity in ration_quantity.
const rationQuantityOf = (visit: any): number =>
    quantityOf(
        visit,
        visit?.values?.ration_quantity != null
            ? 'ration_quantity'
            : rationQuantityField(rationTypeOf(visit)),
    );

// The total quantity of each ration type given over these visits, in the
// order each type was first given.
const suppliesGiven = (visits: Array<any>) => {
    const visitsByType = groupBy(
        visits.filter(visit => !!rationTypeOf(visit)),
        rationTypeOf,
    );
    return Object.entries(visitsByType).map(([type, visitsOfType]) => ({
        type,
        quantity: visitsOfType.reduce(
            (total: number, visit: any) => total + rationQuantityOf(visit),
            0,
        ),
    }));
};

const timeOf = (visit: any): number => new Date(visit?.createdAt).getTime();

// The supplies given at each of these visits. The medical and assistance
// forms are filled after the anthropometric one, so an assistance visit
// (from either) goes with the last visit created before it, or with the
// first visit when none was.
const suppliesByVisit = (visits: Array<any>, assistanceVisits: Array<any>) => {
    const assistancesByVisit: Array<Array<any>> = visits.map(() => []);
    if (visits.length === 0) {
        return [];
    }
    assistanceVisits.forEach(assistance => {
        let index = 0;
        let latest = -Infinity;
        visits.forEach((visit, i) => {
            const time = timeOf(visit);
            if (time <= timeOf(assistance) && time > latest) {
                index = i;
                latest = time;
            }
        });
        assistancesByVisit[index].push(assistance);
    });
    return assistancesByVisit.map(suppliesGiven);
};

export {
    rationTypeOf,
    rationQuantityField,
    quantityOf,
    suppliesGiven,
    suppliesByVisit,
};
