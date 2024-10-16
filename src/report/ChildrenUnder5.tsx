import React from "react";
import Entity from "../entity/Entity";
import { sumBy } from "lodash";

function sumByAge(
  entities: Array<Entity>,
  ageCheck: (age: number) => boolean
): number {
  return sumBy(entities, (child) => {
    let age = child.profile.values?.age_months;
    if (age != null && ageCheck(age)) {
      return 1;
    }
    return 0;
  });
}

const root = {
  width: "100%",
  margin: "auto",
  height: "80%",
  marginBottom: "70px",
  textAlign: "center",
} as const;
const table = {
  margin: "auto",
  alignItems: "center",
  width: "80%",
  borderCollapse: "collapse",
  border: "1pt solid black",
} as const;

const th = {
  border: "1pt solid black",
  textAlign: "left",
} as const;

const td = {
  border: "1pt solid black",
} as const;

function ChildrenUnder5(
  entities: Array<Entity>,
  startDate: Date,
  endDate: Date,
  program: string
) {
  const boys = entities.filter(
    (entity) => entity.profile.values?.gender === "Male"
  );
  const girls = entities.filter(
    (entity) => entity.profile.values?.gender === "Female"
  );
  const boyBetween6And23 = sumByAge(boys, (age) => age <= 23);
  const girlBetween6And23 = sumByAge(girls, (age) => age <= 23);
  const boyBetween24And59 = sumByAge(boys, (age) => age > 23);
  const girlBetween24And59 = sumByAge(girls, (age) => age > 23);

  return (
    <div style={root}>
      <table style={table}>
        <thead style={table}>
          <tr style={table}>
            <th style={table}>Months</th>

            <th colSpan={2} style={td}>
              <table width={72}>
                <tr style={td}>
                  <td colSpan={2} style={td}>
                    6-23
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
          </tr>{" "}
        </thead>
        <tbody style={table}>
            <tr>
                    <td>Total of child</td>
                    <td className="align">{girlBetween6And23}</td>
                    <td className="align">{boyBetween6And23}</td>
                    <td className="align">{girlBetween24And59}</td>
                    <td className="align">{boyBetween24And59}</td>
                    <td className="align">{girlBetween6And23 + girlBetween24And59}</td>
                    <td className="align">{boyBetween6And23 + boyBetween24And59}</td>
                </tr>
        </tbody>
      </table>
    </div>
  );
}
export { ChildrenUnder5 };