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
    let totalDefaulter = [
        sum(defaulters?.between6And23 ?? defaulters?.under19),
        sum(defaulters?.between24And59 ?? defaulters?.over19),
    ];

    let absentees = data.find((row: any) => row.key === 'absentees');
    let totalAbsentees = [
        sum(absentees?.between6And23 ?? absentees?.under19),
        sum(absentees?.between24And59 ?? absentees?.over19),
    ];

    let nonRespondents = data.find(
        (row: any) => row.key === 'non_respondent__int__',
    );
    let totalNonRespondents = [
        sum(nonRespondents.between6And23 ?? nonRespondents?.under19),
        sum(nonRespondents.between24And59 ?? nonRespondents?.over19),
    ];

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
