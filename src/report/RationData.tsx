import { categoryDictionary } from '../utils/Array';
import { groupBy, sumBy } from 'lodash';
import {
    rationTypeOf,
    rationQuantityField,
    quantityOf,
    rationQuantityOf,
    otherRationsGiven,
} from '../utils/Ration';

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

// `rationTypes` lets a program restrict which ration rows it shows (e.g.
// NSEP only ever records rusf/wsbp/lns_mq) instead of always listing every
// ration type this app knows about, most of which would just show 0 for
// that program. `quantityField`, when given, overrides rationQuantityField
// for every type this call shows (e.g. Bangladesh's BSFP report reads
// rusf/wsbp/lns_mq quantities from a single ration_quantity field, unlike
// NSEP's per-type field names for those same 3 ration types). Both are
// pulled out of `props` before spreading the rest as entities below, so
// neither is mistaken for one.
const RationData = (props: any): any => {
    const { rationTypes, quantityField, ...entities } = props ?? {};
    const types: string[] = rationTypes ?? DEFAULT_RATION_TYPES;
    // A beneficiary can be given several ration types (e.g. one on the
    // medical form, another on the assistance form), so each visit is
    // counted under its own.
    const visits = Object.values(entities).flatMap(
        (row: any) => row?.visits ?? [],
    );
    const visitsByType = groupBy(visits, rationTypeOf);
    // The program's ration types are always listed; any other ration type
    // given in the period follows, then the other rations typed in.
    const givenTypes = Object.keys(visitsByType).filter(
        ration => !!ration && !types.includes(ration),
    );
    const total = (ration: string, quantity: (visit: any) => number) => ({
        type: categoryDictionary(ration) ?? ration,
        quantity: sumBy(visitsByType[ration] ?? [], quantity),
    });
    const rations = types
        .map(ration => {
            const fieldName = quantityField ?? rationQuantityField(ration);
            return total(ration, visit => quantityOf(visit, fieldName));
        })
        // Each visit of another type keeps its own quantity field (e.g.
        // cash in _cash_total), whatever the program's quantityField.
        .concat(givenTypes.map(ration => total(ration, rationQuantityOf)))
        .concat(otherRationsGiven(visits));

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
