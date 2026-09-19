import { categoryDictionary } from '../utils/Array';
import { timeStampToDateString } from '../utils/DateFormatter';

const table = {
    margin: 'auto',
    padding: 'auto',
    alignItems: 'center',
    width: '10%',
    borderCollapse: 'collapse',
    border: '1pt solid black',
} as const;

const EregistryBeneficiaries = (
    beneficiaries: Array<any>,
    program: string | undefined,
    physiology: string,
) => {
    return (
        <div>
            <table style={table}>
                <thead style={table}>
                    <tr style={table}>
                        <th style={table}>Admission Date</th>
                        <th style={table}>Name</th>
                        <th style={table}>Age</th>
                        <th style={table}>Birth Date</th>
                        {physiology === '' && <th style={table}>Gender</th>}

                        <th style={table}>Admission Type</th>
                        <th style={table}>Admission Criteria</th>
                        <th style={table}>Weight</th>
                        {physiology === '' && <th style={table}>WHZ</th>}

                        <th style={table}>Visit Date</th>
                        {program?.includes('OTP') && (
                            <th style={table}>Oedema</th>
                        )}
                        <th style={table}>MUAC</th>
                        {physiology === '' && <th style={table}>WHZ</th>}
                        <th style={table}>Status</th>
                        <th style={table}>Visit number</th>
                        <th style={table}>Exit Date</th>
                        <th style={table}>Exit Weight</th>
                        <th style={table}>Exit MUAC</th>
                        <th style={table}>Duration(days)</th>
                    </tr>
                </thead>
                <tbody style={table}>
                    {beneficiaries.map((beneficiary: any) => {
                        return [
                            <>
                                <tr style={table}>
                                    <td style={table}>
                                        {beneficiary.admission_date}
                                    </td>
                                    <td style={table}>
                                        {beneficiary.firstName}{' '}
                                        {beneficiary.middleName}{' '}
                                        {beneficiary.lastName}
                                    </td>
                                    <td style={table}>{beneficiary.age}</td>

                                    <td style={table}>
                                        {beneficiary.birth_date}
                                    </td>

                                    {physiology === '' && (
                                        <td style={table}>
                                            {beneficiary.gender}
                                        </td>
                                    )}

                                    <td style={table}>
                                        {categoryDictionary(
                                            beneficiary.admissionType,
                                        )}
                                    </td>
                                    <td style={table}>
                                        {categoryDictionary(
                                            beneficiary.admissionChoice,
                                        )}
                                    </td>
                                    <td style={table}>{beneficiary.weight}</td>
                                    {physiology === '' && (
                                        <td style={table}>
                                            {beneficiary.whzScore}
                                        </td>
                                    )}

                                    <td style={table} />
                                    {program?.includes('OTP') && (
                                        <td style={table}>
                                            {beneficiary?.oedemaStatus}
                                        </td>
                                    )}

                                    <td style={table} />
                                    {physiology === '' && <td style={table} />}

                                    <td style={table}>
                                        {categoryDictionary(
                                            beneficiary.exit_type,
                                        )}
                                    </td>
                                    <td style={table}>
                                        {beneficiary.visit_number}
                                    </td>
                                    <td style={table}>
                                        {beneficiary?.exitVisit}
                                    </td>
                                    <td style={table}>
                                        {beneficiary?.exit?.exitWeight}
                                    </td>
                                    <td style={table}>
                                        {beneficiary.exitMuac}
                                    </td>
                                    <td style={table}>
                                        {beneficiary?.lengthOfStay}
                                    </td>
                                </tr>
                                {beneficiary?.visits.map((visit: any) => {
                                    let oedemaStatus = null;

                                    if (
                                        visit?.values?.oedema_status__int__ !==
                                        '0'
                                    ) {
                                        oedemaStatus =
                                            visit?.values?.oedema_severity ===
                                            '1'
                                                ? '+'
                                                : visit?.values
                                                      ?.oedema_severity === '2'
                                                ? '++'
                                                : visit?.values
                                                      ?.oedema_severity === '3'
                                                ? '+++'
                                                : '';
                                    }
                                    return (
                                        <tr style={table}>
                                            {(physiology === '' && (
                                                <td style={table} colSpan={9} />
                                            )) || (
                                                <td style={table} colSpan={8} />
                                            )}

                                            <td style={table}>
                                                {timeStampToDateString(
                                                    visit?.values?.visit_date ??
                                                        visit?.createdAt,
                                                )}
                                            </td>
                                            {program?.includes('OTP') && (
                                                <td style={table}>
                                                    {oedemaStatus}
                                                </td>
                                            )}
                                            <td style={table}>
                                                {visit?.values?.muac}
                                            </td>

                                            {physiology === '' && (
                                                <td style={table}>
                                                    {visit?.values?._whz_score}
                                                </td>
                                            )}

                                            <td style={table} colSpan={7} />
                                        </tr>
                                    );
                                })}
                            </>,
                        ];
                    })}
                </tbody>
            </table>
        </div>
    );
};
export { EregistryBeneficiaries };
