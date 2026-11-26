import { countryConfig } from '../config/country';

// A visit's ration type, or '' when it records none — forms that share a
// rationGiven list without recording a ration (e.g. anthropometric follow
// ups) must not be counted as a ration of type "undefined".
const rationTypeOf = (visit: any): string =>
    visit?.values?.ration ||
    visit?.values?.ration_given ||
    visit?.values?.ration_type ||
    visit?.values?.ration_type_tsfp ||
    visit?.values?.ration_type_otp ||
    countryConfig.resolveRationType?.(visit?.values) ||
    '';

// The field a ration type's quantity is recorded in.
const rationQuantityField = (ration: string): string => {
    const fields: Record<string, string> = {
        csb: '_csb_packets',
        csb1: '_csb_packets',
        csb2: '_csb_packets',
        lndf: '_lndf_kgs',
        wsb: '_wsb_packets',
        wsbp: '_wsbp_packets',
        cash_voucher: '_cash_total',
        in_kind: 'ration_quantity',
    };
    return fields[ration] ?? '_total_number_of_sachets';
};

// The quantity of ration a visit records in this field. The medical forms
// record theirs in `quantity` instead of the ration type's own field.
const quantityOf = (visit: any, field: string): number => {
    const quantity = parseFloat(
        visit?.values?.[field] ??
            visit?.values?.main_other_ration_quantity ??
            visit?.values?.quantity,
    );
    return Number.isNaN(quantity) ? 0 : quantity;
};

// The other ration given at a visit besides its main one (e.g. Bangladesh's
// BSFP/NSEP "another ration provided"), named with what was typed in and
// its unit, or null when there is none.
const otherRationOf = (visit: any) => {
    const values = visit?.values;
    const name = `${values?.other_ration_specify ?? ''}`.trim();
    if (!name || `${values?.another_ration_provided}` === '0') {
        return null;
    }
    const unit = values?._other_ration_unit_label || values?.other_ration_unit;
    const quantity = parseFloat(values?.other_ration_quantity);
    return {
        type: unit ? `${name} (${unit})` : name,
        quantity: Number.isNaN(quantity) ? 0 : quantity,
    };
};

// The total quantity of each other ration given over these visits, in the
// order each was first given.
const otherRationsGiven = (visits: Array<any>) => {
    const totals = new Map<string, number>();
    visits.forEach(visit => {
        const other = otherRationOf(visit);
        if (other) {
            totals.set(
                other.type,
                (totals.get(other.type) ?? 0) + other.quantity,
            );
        }
    });
    return Array.from(totals, ([type, quantity]) => ({ type, quantity }));
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

interface Ration {
    type: string;
    quantity: number;
}

const isFilled = (value: any) => value != null && `${value}`.trim() !== '';

const toQuantity = (value: any): number => {
    const quantity = parseFloat(value);
    return Number.isNaN(quantity) ? 0 : quantity;
};

// The rations of the ration_repeat group, filled once per ration given: its
// type in `ration`, its quantity in _<type>_packets_rep (e.g.
// _wsb_packets_rep), or the sachets it comes to.
const repeatedRationsOf = (visit: any): Ration[] => {
    let repeat = visit?.values?.ration_repeat;
    if (typeof repeat === 'string') {
        try {
            repeat = JSON.parse(repeat);
        } catch {
            return [];
        }
    }
    if (!Array.isArray(repeat)) return [];
    return repeat
        .filter((item: any) => isFilled(item?.ration))
        .map((item: any) => {
            const type = `${item.ration}`.trim();
            const quantity = [
                item[`_${type}_packets_rep`],
                item._sachets_rep,
                item.manual_quantity,
            ].find(isFilled);
            return { type, quantity: toQuantity(quantity) };
        });
};

const SELECTED_PREFIX = '_selected_';

// Fields that can hold the quantity of a ration type selected on an
// assistance form: _<type>_packets on the PBWG forms; the totals on the
// child forms (e.g. _total_wsb_packets, _total_number_of_sachets_rutf, and
// _total_lns_packets for lns_mq).
const selectedQuantityFields = (type: string): string[] => {
    const base = type.split('_')[0];
    return [
        `_${type}_packets`,
        `_total_${type}_packets`,
        `_total_${base}_packets`,
        `_total_number_of_sachets_${type}`,
    ];
};

// The rations selected on an assistance form, given together: each in a
// _selected_<type> field (e.g. _selected_wsb), its quantity in one of
// selectedQuantityFields. A selected type without a quantity is left out.
const selectedRationsOf = (visit: any): Ration[] =>
    Object.keys(visit?.values ?? {})
        .filter(
            field =>
                field.startsWith(SELECTED_PREFIX) &&
                isFilled(visit.values[field]),
        )
        .map(field => field.slice(SELECTED_PREFIX.length))
        .map(type => ({
            type,
            quantity: selectedQuantityFields(type)
                .map(field => visit.values[field])
                .find(isFilled),
        }))
        .filter(({ quantity }) => quantity !== undefined)
        .map(({ type, quantity }) => ({
            type,
            quantity: toQuantity(quantity),
        }));

const isMedicalForm = (visit: any) =>
    `${visit?.formFormId ?? ''}`.toLowerCase().includes('medical');

// Every ration given at a visit with its quantity. Several rations given at
// once are read off the ration_repeat group on the medical forms and off
// the _selected_ fields on the assistance forms, each falling back on the
// other; a single ration off the visit's ration type, its quantity read by
// `singleQuantity`.
const rationsOf = (
    visit: any,
    singleQuantity: (visit: any) => number = rationQuantityOf,
): Ration[] => {
    const [first, second] = isMedicalForm(visit)
        ? [repeatedRationsOf, selectedRationsOf]
        : [selectedRationsOf, repeatedRationsOf];
    const firstRations = first(visit);
    const several = firstRations.length > 0 ? firstRations : second(visit);
    if (several.length > 0) return several;
    const type = rationTypeOf(visit);
    return type ? [{ type, quantity: singleQuantity(visit) }] : [];
};

const givesRation = (visit: any) => rationsOf(visit).length > 0;

// The total quantity of each ration, in the order each was first given.
const sumRations = (rations: Ration[]): Ration[] => {
    const totals = new Map<string, number>();
    rations.forEach(({ type, quantity }) =>
        totals.set(type, (totals.get(type) ?? 0) + quantity),
    );
    return Array.from(totals, ([type, quantity]) => ({ type, quantity }));
};

// The total quantity of each ration type given over these visits, in the
// order each type was first given, then of each other ration.
const suppliesGiven = (visits: Array<any>) =>
    sumRations(visits.flatMap(visit => rationsOf(visit))).concat(
        otherRationsGiven(visits),
    );

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
    rationQuantityOf,
    otherRationOf,
    otherRationsGiven,
    suppliesGiven,
    suppliesByVisit,
    rationsOf,
    givesRation,
    sumRations,
};
export type { Ration };
