import { categoryDictionary } from "../utils/Array";
import { groupBy } from "lodash";

const table = {
    margin: "auto",
    padding: "auto",
    alignItems: "center",
    width: "80%",
    borderCollapse: "collapse",
    border: "1pt solid black",
} as const;

const RationData = (entities: any): any => {
    let rationTypes = ["rusf", "rutf", "csb", "csb1", "csb2"];
    let groupRationByType = groupBy({ ...entities }, "ration");

    const rations = rationTypes.map((ration) => {
        let quantity = 0;
        let rows = groupRationByType[ration] ?? [];
        let allRows = rows.reduce(
            (value: any, row: any) => value.concat(row.visits),
            []
        );

        if (["csb", "csb1", "csb2"]?.includes(ration)) {
            quantity = allRows.reduce(
                (value: any, visit: any) =>
                    value + parseFloat(visit?.values?._csb_packets),
                0
            );
        } else {
            if (ration === "lndf") {
                quantity = allRows.reduce(
                    (value: any, visit: any) =>
                        value + parseFloat(visit?.values?._lndf_kgs),
                    0
                );
            } else {
                quantity = allRows.reduce(
                    (value: any, visit: any) =>
                        value + parseFloat(visit?.values?._total_number_of_sachets),
                    0
                );
            }
        }
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