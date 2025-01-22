import { categoryDictionary } from '../../utils/Array';

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

const ReportPBWGContent = (category: any): any => {
    let under19 = 0;
    let over19 = 0;

    return (
        <div style={root}>
            <br />
            <div>{category?.category} </div>

            <table style={table}>
                <thead style={table}>
                    <tr style={table}>
                        <th style={table}>Year</th>

                        <th colSpan={2} style={td}>
                            <table width={72}>
                                <tr style={td}>
                                    <td colSpan={2} style={td}>
                                        {'<= 19'}
                                    </td>
                                </tr>
                                <tr style={td}>
                                    <td className="align" style={td}>
                                        P
                                    </td>
                                    <td className="align" style={td}>
                                        L
                                    </td>
                                </tr>
                            </table>
                        </th>

                        <th colSpan={2} style={td}>
                            <table width={72}>
                                <tr style={table}>
                                    <td colSpan={2} style={td}>
                                        {'> 19'}
                                    </td>
                                </tr>
                                <tr style={table}>
                                    <td className="align" style={td}>
                                        P
                                    </td>
                                    <td className="align" style={td}>
                                        L
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
                                        P
                                    </td>
                                    <td className="align" style={td}>
                                        L
                                    </td>
                                </tr>
                            </table>
                        </th>
                    </tr>
                </thead>
                <tbody style={table}>
                    {category?.rows?.map((subCategory: any) => {
                        const pregnantUnder19 = subCategory.under19[0] ?? 0;
                        const lactatingUnder19 = subCategory.under19[1] || 0;

                        const pregnantOver19 = subCategory.over19[0] || 0;
                        const lactatingOver19 = subCategory.over19[1] || 0;
                        under19 += pregnantUnder19 + lactatingUnder19;
                        over19 += pregnantOver19 + lactatingOver19;
                        let key = '';

                        if (subCategory && subCategory.admissionType) {
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
                                    {pregnantUnder19}
                                </td>
                                <td className="align" style={td}>
                                    {lactatingUnder19}
                                </td>
                                <td className="align" style={td}>
                                    {pregnantOver19}
                                </td>
                                <td className="align" style={td}>
                                    {lactatingOver19}
                                </td>
                                <td className="align" style={td}>
                                    {pregnantUnder19 + pregnantOver19}
                                </td>
                                <td className="align" style={td}>
                                    {lactatingUnder19 + lactatingOver19}
                                </td>
                            </tr>
                        );
                    })}
                    {category?.showTotal && (
                        <tr style={table}>
                            <td style={th}>{category?.total?.status}</td>
                            <td colSpan={2} className="align" style={td}>
                                {under19}
                            </td>
                            <td colSpan={2} className="align" style={td}>
                                {over19}
                            </td>
                            <td colSpan={2} className="align" style={td}>
                                {under19 + over19}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <br />
        </div>
    );
};

export { ReportPBWGContent };
