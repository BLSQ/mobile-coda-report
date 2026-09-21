import { categoryDictionary, sumByFieldValues } from '../utils/Array';
import { groupBy } from 'lodash';

const table = {
    margin: 'auto',
    padding: 'auto',
    alignItems: 'center',
    width: '80%',
    borderCollapse: 'collapse',
    border: '1pt solid black',
} as const;

const DEFAULT_RATION_TYPES: string[] = [
    'rusf',
    'rutf',
    'wsb',
    'wsbp',
    'lns_mq',
];

const defaultQuantityField = (ration: string): string => {
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

// `rationTypes` lets a program restrict which ration rows it shows (e.g.
// NSEP only ever records rusf/wsbp/lns_mq) instead of always listing every
// ration type this app knows about, most of which would just show 0 for
// that program. `quantityField`, when given, overrides defaultQuantityField
// for every type this call shows (e.g. Bangladesh's BSFP report reads
// rusf/wsbp/lns_mq quantities from a single ration_quantity field, unlike
// NSEP's per-type field names for those same 3 ration types). Both are
// pulled out of `props` before spreading the rest as entities below, so
// neither is mistaken for one.
const RationData = (props: any): any => {
    const { rationTypes, quantityField, ...entities } = props ?? {};
    const types: string[] = rationTypes ?? DEFAULT_RATION_TYPES;
    let groupRationByType = groupBy({ ...entities }, 'ration');
    const rations = types.map((ration: string) => {
        let rows = groupRationByType[ration] ?? [];
        let assistanceVisits = rows.reduce(
            (value: any, row: any) => value.concat(row.visits),
            [],
        );
        let fieldName = quantityField ?? defaultQuantityField(ration);
        let quantity = sumByFieldValues(assistanceVisits, fieldName);
        return {
            type: categoryDictionary(ration),
            quantity: quantity,
        };
    });

    return (
        <table style={table}>
            <thead style={table}>
                <tr style={table}>
                    <th style={table}>Type</th>
                    <th style={table}>Quantity</th>
                </tr>
            </thead>
            <tbody style={table}>
                {rations.map((ration: any) => {
                    return (
                        <tr style={table}>
                            <td style={table}>{ration.type}</td>
                            <td style={table}>{ration.quantity}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};
export { RationData };
