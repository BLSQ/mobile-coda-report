import Entity from "./entity/Entity";
import Form from "./entity/Form";
import { dateFromJson } from "./utils/DateFormatter";
import { chain } from "lodash";
//import FAKE_DATA from "./fake/FakeData";
//import FAKE_LOCAL_HF from "./fake/FakeLocalHealthFacility";

function toForm(form: any): Form {
    return {
        id: form["id"],
        formId: form["formId"],
        formFormId: form["formFormId"],
        orgUnitId: form["orgUnitId"],
        orgUnitName: form["orgUnitName"],
        createdAt: dateFromJson(form["createdAt"]),
        updatedAt: dateFromJson(form["updatedAt"]),
        values: form["values"],
    } as Form;
}

function LoadForms(): Array<Entity> {
    // @ts-ignore
    //const formsToLoad = JSON.parse(FAKE_DATA);
    const formsToLoad = JSON.parse(Android.loadForms());
    // @ts-ignore
    //const localHealthFacility = JSON.parse(FAKE_LOCAL_HF);
    const localHealthFacility = JSON.parse(Android.currentOrgUnit());

    return chain(formsToLoad)
        .groupBy((it) => it["entityId"])
        .map((forms: Array<any>, key) => {
            return {
                id: key as string,
                entityTypeId: forms[0]["entityTypeId"],
                entityTypeName: forms[0]["entityTypeName"],
                profile: chain(forms)
                    .filter((form) => form["id"] === key)
                    .map((form) => toForm(form))
                    .value()[0],
                visits: chain(forms)
                    .filter(
                        (form) =>
                            form["id"] !== key &&
                            (form["orgUnitId"] === localHealthFacility?.id ||
                                form?.values?.org_unit_id === localHealthFacility?.id ||
                                form?.values?.current_ou_id === localHealthFacility?.id ||
                                form?.values?._ou_id === localHealthFacility?.id)
                    )
                    .map((form) => toForm(form))
                    .sort((f1: Form, f2: Form) => {
                        if (f1.createdAt < f2.createdAt) {
                            return -1;
                        }
                        if (f1.createdAt > f2.createdAt) {
                            return 1;
                        }
                        return 0;
                    })
                    .value(),
            } as Entity;
        })
        .value();
}
export default LoadForms;