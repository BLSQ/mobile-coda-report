import { categoryDictionary } from '../utils/Array';

const root = {
    width: '100%',
    margin: 'auto',
    textAlign: 'center',
} as const;

const table = {
    margin: 'auto',
    alignItems: 'center',
    width: '80%',
    borderCollapse: 'collapse',
    border: '1pt solid black',
} as const;

const th = {
    border: '1pt solid black',
    textAlign: 'left',
} as const;

const td = {
    border: '1pt solid black',
} as const;

const ReportContent = (category: any): any => {
    let between6And23 = 0;
    let between24And59 = 0;
    return (
        <div style={root}>
            <br />
            <div>{category?.category} </div>
            <table style={table}>
                <thead style={table}>
                    <tr style={table}>
                        <th style={table}> Months </th>
                        <th colSpan={2} style={td}>
                            <table width={72}>
                                <tr style={td}>
                                    <td colSpan={2} style={td}>
                                        6 - 23
                                    </td>
                                </tr>
                                <tr style={td}>
                                    <td className="align" style={td}>
                                        M
                                    </td>
                                    <td className="align" style={td}>
                                        F
                                    </td>
                                </tr>
                            </table>
                        </th>
                        <th colSpan={2} style={td}>
                            <table width={72}>
                                <tr style={table}>
                                    <td colSpan={2} style={td}>
                                        24-59
                                    </td>
                                </tr>
                                <tr style={table}>
                                    <td className="align" style={td}>
                                        M
                                    </td>
                                    <td className="align" style={td}>
                                        F
                                    </td>
                                </tr>
                            </table>
                        </th>
                        <th colSpan={2} style={td}>
                            <table width={72}>
                                <tr style={table}>
                                    <td colSpan={2} style={td}>
                                        Total
                                    </td>
                                </tr>
                                <tr style={table}>
                                    <td className="align" style={td}>
                                        M
                                    </td>
                                    <td className="align" style={td}>
                                        F
                                    </td>
                                </tr>
                            </table>
                        </th>
                    </tr>
                </thead>

                <tbody style={table}>
                    {category?.rows?.map((subCategory: any) => {
                        const boyBetween6And23 =
                            subCategory.between6And23[0] ?? 0;
                        const girlBetween6And23 =
                            subCategory.between6And23[1] ?? 0;
                        const boyBetween24And59 =
                            subCategory.between24And59[0] ?? 0;
                        const girlBetween24And59 =
                            subCategory.between24And59[1] ?? 0;
                        between6And23 += boyBetween6And23 + girlBetween6And23;
                        between24And59 +=
                            boyBetween24And59 + girlBetween24And59;
                        const boys = boyBetween6And23 + boyBetween24And59;
                        const girls = girlBetween6And23 + girlBetween24And59;
                        let key = '';
                        if (subCategory && subCategory.admissionType) {
                            if (
                                subCategory?.program === 'TSFP' &&
                                subCategory.admissionType ===
                                    'referred_from_other_otp'
                            ) {
                                subCategory.admissionType = 'referred_from_otp';
                            }
                            const admissionType = categoryDictionary(
                                subCategory?.admissionType,
                            );
                            const admissionCriteria = categoryDictionary(
                                subCategory?.admissionCriteria,
                            );
                            key = `${admissionType} ${admissionCriteria}`;
                        } else {
                            key =
                                categoryDictionary(subCategory?.key) ??
                                subCategory?.key;
                        }

                        return (
                            <tr style={table}>
                                <td style={th}>{key}</td>
                                <td className="align" style={td}>
                                    {boyBetween6And23}
                                </td>
                                <td className="align" style={td}>
                                    {girlBetween6And23}
                                </td>
                                <td className="align" style={td}>
                                    {boyBetween24And59}
                                </td>
                                <td className="align" style={td}>
                                    {girlBetween24And59}
                                </td>
                                <td className="align" style={td}>
                                    {boys}
                                </td>
                                <td className="align" style={td}>
                                    {girls}
                                </td>
                            </tr>
                        );
                    })}
                    {category?.showTotal && (
                        <tr style={table}>
                            <td style={th}>{category?.total?.status}</td>
                            <td colSpan={2} className="align" style={td}>
                                {between6And23}
                            </td>
                            <td colSpan={2} className="align" style={td}>
                                {between24And59}
                            </td>
                            <td colSpan={2} className="align" style={td}>
                                {between6And23 + between24And59}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export { ReportContent };
