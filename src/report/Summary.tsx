import { sum } from 'lodash';

const table = {
    margin: 'auto',
    padding: 'auto',
    alignItems: 'center',
    width: '80%',
    borderCollapse: 'collapse',
    border: '1pt solid black',
} as const;
const td = {
    border: '1pt solid black',
} as const;

function Summary(data: any[]) {
    let defaulters = data.find((row: any) => row.key === 'defaulter');
    // Every age column of a row: 0-5 (South Sudan OTP), 6-23 and 24-59 for
    // children, under/over 19 for PBWG.
    const ages = (row: any) => [
        sum(row?.under6),
        sum(row?.between6And23 ?? row?.under19),
        sum(row?.between24And59 ?? row?.over19),
    ];
    let totalDefaulter = ages(defaulters);

    let absentees = data.find((row: any) => row.key === 'absentees');
    let totalAbsentees = ages(absentees);

    let nonRespondents = data.find(
        (row: any) => row.key === 'non_respondent__int__',
    );
    let totalNonRespondents = ages(nonRespondents);

    return (
        <table style={table}>
            <tr style={td}>
                <td colSpan={2} className="align" style={td}>
                    Defaulters
                </td>
                <td colSpan={2} className="align" style={td}>
                    {sum(totalDefaulter)}
                </td>
            </tr>
            <tr style={td}>
                <td colSpan={2} className="align" style={td}>
                    Absentees
                </td>
                <td colSpan={2} className="align" style={td}>
                    {sum(totalAbsentees)}
                </td>
            </tr>
            <tr style={td}>
                <td colSpan={2} className="align" style={td}>
                    Non-Respondents
                </td>
                <td colSpan={2} className="align" style={td}>
                    {sum(totalNonRespondents)}
                </td>
            </tr>
        </table>
    );
}
export { Summary };
