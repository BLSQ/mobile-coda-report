import { categoryDictionary } from '../utils/Array';
import {
    rationTypeOf,
    rationQuantityField,
    quantityOf,
    rationQuantityOf,
    otherRationsGiven,
    rationsOf,
    sumRations,
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
    // medical form, another on the assistance form, or several on one
    // form), so each ration is counted under its own type.
    const visits = Object.values(entities).flatMap(
        (row: any) => row?.visits ?? [],
    );
    // A single ration of the program's types reads its quantity off
    // `quantityField` when given; any other ration type keeps its own
    // quantity field (e.g. cash in _cash_total).
    const singleQuantity = (visit: any) => {
        const ration = rationTypeOf(visit);
        return types.includes(ration)
            ? quantityOf(visit, quantityField ?? rationQuantityField(ration))
            : rationQuantityOf(visit);
    };
    const given = sumRations(
        visits.flatMap(visit => rationsOf(visit, singleQuantity)),
    );
    const quantityGiven = (ration: string) =>
        given.find(row => row.type === ration)?.quantity ?? 0;
    // The program's ration types are always listed; any other ration type
    // given in the period follows, then the other rations typed in.
    const rations = types
        .concat(
            given
                .map(row => row.type)
                .filter(ration => !types.includes(ration)),
        )
        .map(ration => ({
            type: categoryDictionary(ration) ?? ration,
            quantity: quantityGiven(ration),
        }))
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
