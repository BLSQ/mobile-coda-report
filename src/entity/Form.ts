interface Form {
    readonly id: string;
    readonly formId: string;
    readonly formName: string;
    readonly formFormId: string;
    readonly orgUnitId: string;
    readonly orgUnitName: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly values: any | null,
}

export default Form