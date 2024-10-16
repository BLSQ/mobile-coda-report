import Form from "./Form";

interface Entity {
    readonly id: string;
    readonly entityTypeId: string;
    readonly profile: Form;
    readonly visits: Array<Form>;
}

export default Entity