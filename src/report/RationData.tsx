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

const RationData = (entities: any): any => {
    let rationTypes = [
        'rusf',
        'rutf',
        //'csb',
        //'csb1',
        //'csb2',
        'lndf',
        'wsb',
        'wsbp',
        'lns_mq',
    ];
    let groupRationByType = groupBy({ ...entities }, 'ration');
    const rations = rationTypes.map(ration => {
        let quantity = 0;
        let rows = groupRationByType[ration] ?? [];
        let assistanceVisits = rows.reduce(
            (value: any, row: any) => value.concat(row.visits),
            [],
        );
        let fieldName = '';
        if (['csb', 'csb1', 'csb2']?.includes(ration)) {
            fieldName = '_csb_packets';
        } else {
            if (ration === 'lndf') {
                fieldName = '_lndf_kgs';
            } else {
                if (ration === 'wsb') {
                    fieldName = '_wsb_packets';
                } else {
                    if (ration === 'wsbp') {
                        fieldName = '_wsbp_packets';
                    } else {
                        fieldName = '_total_number_of_sachets';
                    }
                }
            }
        }
        quantity = sumByFieldValues(assistanceVisits, fieldName);
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
