import { categoryDictionary } from '../utils/Array';

const table = {
    margin: 'auto',
    padding: 'auto',
    alignItems: 'center',
    borderCollapse: 'collapse',
    border: '1pt solid black',
} as const;

function BeneficiariesFollowup(
    beneficiaries: Array<any>,
    label: string,
    entityType: string | undefined,
) {
    return (
        <div>
            <h4>{categoryDictionary(label)}</h4>
            <table style={table}>
                <thead style={table}>
                    <tr style={table}>
                        <th style={table}>Name</th>
                        <th style={table}>Age</th>
                        {(entityType && (
                            <>
                                <th style={table}>Gender</th>
                                <th style={table}>Care giver</th>
                                <th style={table}>Progress Id</th>
                            </>
                        )) || <th style={table}>Card Number</th>}

                        <th style={table}>Status</th>
                    </tr>
                </thead>
                <tbody style={table}>
                    {beneficiaries.map((beneficiary: any) => {
                        return (
                            <tr style={table}>
                                <td style={table}>{beneficiary.name}</td>
                                <td style={table}>{beneficiary.age}</td>
                                {entityType && (
                                    <>
                                        <td style={table}>
                                            {beneficiary.gender}
                                        </td>
                                        <td style={table}>
                                            {beneficiary.careGiver}
                                        </td>
                                    </>
                                )}

                                <td style={table}>
                                    {beneficiary.registrationNumber}
                                </td>
                                <td style={table}>
                                    {categoryDictionary(beneficiary.status)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
export { BeneficiariesFollowup };
