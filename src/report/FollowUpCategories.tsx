import { agregatedBeneficiaryFolloWup } from "../utils/DataFilter";
import { BeneficiariesFollowup } from "./BeneficiariesFollowup";
import { uniqBy } from "lodash";

const root = {
  width: "100%",
  height: "80%",
  textAlign: "center",
  fontSize: "13.5px"
} as const;

const FolloWupCategories = (
  category: string,
  program: string,
  entities: Array<any>,
  startDate: Date,
  endDate: Date
) => {
  const dateValue = `${startDate.toDateString()} to ${endDate.toDateString()}`;
  let beneficiaries = agregatedBeneficiaryFolloWup(program, entities, startDate, endDate);

  if (category !== "") {
    beneficiaries = beneficiaries.filter((entity: any) => entity?.status === category)
  } else {
    beneficiaries = uniqBy(beneficiaries, "id")
  }

  return (
    <div style={root}>
      <div>
        <h3>{`${program} beneficiary followup`}</h3>
        <h3>{dateValue}</h3>
        {BeneficiariesFollowup(beneficiaries, category)}
      </div>
      <br />
    </div>
  );
}
export { FolloWupCategories };