export {};

// DataByCategory reads countryConfig at import time, so each country gets a
// fresh module instance with that country's config in place of the one
// resolved from the native bridge.
const withCountry = (country: string, run: (module: any) => any) => {
    let result: any;
    jest.isolateModules(() => {
        jest.doMock('../config/country', () => ({
            countryConfig: jest.requireActual(`../config/country/${country}`)
                .default,
        }));
        jest.doMock('./DataFilter', () => ({
            ...jest.requireActual('./DataFilter'),
            filterDataOnProgram: (e: any) => e,
            followUpData: (e: any) => e,
        }));
        result = run(require('./DataByCategory'));
    });
    return result;
};

const medicalReportFor = (
    country: string,
    program: string,
    entities: Array<any>,
) =>
    withCountry(country, ({ medicalReports }) =>
        medicalReports(
            entities,
            program,
            new Date(),
            new Date(),
            'Child Under 5',
        ),
    );

const child = (id: string, ageMonths: number, ...visits: Array<any>) => ({
    id,
    profile: { values: { gender: 'M', age_months: ageMonths } },
    visits: visits.map(values => ({ values })),
});

const entities = [
    child('a', 14, {
        medical_complications: 'intractablevomit highfever',
        immunization_status: 'motherdoesnotrecall',
        have_diarrhoea__bool__: '1',
    }),
    child('b', 30, {
        medical_complications: '[highfever, other]',
        medical_complications_other: 'Malaria suspected',
        immunization_status: 'complete',
        medication_2: 'amoxillin erythromycin',
        medication: 'albendazole',
        child_vomiting__bool__: '1',
    }),
    child(
        'c',
        4,
        { immunization_status: 'motherdoesnot recall' },
        { immunization_status: 'motherdoesnotrecall' },
        { have_diarrhoea__bool__: '1', dermatosis_dermatosis: 'mild' },
    ),
];

const section = (report: any, title: string) =>
    report.find((category: any) => category.category === title)?.rows;
const labels = (rows: Array<any>) => rows.map(row => row.label);
const row = (rows: Array<any>, label: string) =>
    rows.find(current => current.label === label);

describe('South Sudan Child Under 5 medical report', () => {
    const report = medicalReportFor('southSudan', 'OTP', entities);

    it('has its sections in order', () => {
        expect(report.map((category: any) => category.category)).toEqual([
            '',
            'Immunization',
            'HIV',
            'Malaria',
            'Medication',
            'Complications',
        ]);
        expect(labels(section(report, ''))).toEqual([
            'Number of Diarrhoea',
            'Problems urinating',
            'Contact with TB person',
            'Poor appetite',
            'Failed appetite test',
        ]);
        expect(labels(section(report, 'Complications'))).toHaveLength(12);
    });

    it('reads space-separated complications and select_multiple medication', () => {
        const complications = section(report, 'Complications');
        expect(row(complications, 'Intractable vomit').between6And23).toEqual([
            1, 0,
        ]);
        expect(row(complications, 'High fever').between24And59).toEqual([1, 0]);
        expect(labels(complications)).not.toContain('Malaria suspected');
        const medication = section(report, 'Medication');
        expect(row(medication, 'Erythromycin given').between24And59).toEqual([
            1, 0,
        ]);
        expect(row(medication, 'Albendazole given').between24And59).toEqual([
            1, 0,
        ]);
        expect(labels(medication)).not.toContain('Failed appetite test');
    });

    it('counts both No idea codes once per child', () => {
        const noIdea = row(section(report, 'Immunization'), 'No idea');
        expect(noIdea.under6).toEqual([1, 0]);
        expect(noIdea.between6And23).toEqual([1, 0]);
    });

    it('splits 0-5 months off 6-23 in OTP only', () => {
        const diarrhoea = row(section(report, ''), 'Number of Diarrhoea');
        expect(diarrhoea.under6).toEqual([1, 0]);
        expect(diarrhoea.between6And23).toEqual([1, 0]);

        const tsfp = medicalReportFor('southSudan', 'TSFP', entities);
        const tsfpDiarrhoea = row(section(tsfp, ''), 'Number of Diarrhoea');
        expect(tsfpDiarrhoea.under6).toBeUndefined();
        expect(tsfpDiarrhoea.between6And23).toEqual([2, 0]);
    });
});

describe('Bangladesh Child Under 5 medical report', () => {
    const report = medicalReportFor('bangladesh', 'OTP', entities);

    it('has its sections in order, without a 0-5 column', () => {
        expect(report.map((category: any) => category.category)).toEqual([
            '',
            'Immunization for Age',
            'Physical examination/Complications',
            'Medication Given',
        ]);
        expect(labels(section(report, ''))).toHaveLength(13);
        expect(labels(section(report, ''))).not.toContain('TB Therapy');
        expect(labels(section(report, ''))).not.toContain('Conjuctivae Palm');
        expect(row(section(report, ''), 'Vomit').between24And59).toEqual([
            1, 0,
        ]);
        expect(row(section(report, ''), 'Diarrhoea').under6).toBeUndefined();
    });

    it('shows one Other row per text typed', () => {
        const complications = section(
            report,
            'Physical examination/Complications',
        );
        expect(labels(complications).slice(-3)).toEqual([
            'Difficulty Drinking or Breastfeeding',
            'hyperbilirubinaemia/\nJaundice',
            'Malaria suspected',
        ]);
        expect(row(complications, 'Malaria suspected').between24And59).toEqual([
            1, 0,
        ]);
    });

    it('does not count the South Sudan legacy immunization code', () => {
        const recall = row(
            section(report, 'Immunization for Age'),
            'Mother does not recall',
        );
        // a (14 months) and c (4 months, its second visit).
        expect(recall.between6And23).toEqual([2, 0]);
    });
});

describe('0-5 months column of the other Child Under 5 tables', () => {
    const tableOf = (country: string, program: string) =>
        withCountry(country, ({ admissionByStatus, sumDataWithCommonKeys }) => {
            const rows = [
                admissionByStatus(
                    'Child Under 5',
                    entities,
                    'Discharges',
                    'cured',
                    program,
                ),
                admissionByStatus(
                    'Child Under 5',
                    entities.slice(0, 1),
                    'Discharges',
                    'death',
                    program,
                ),
            ];
            return {
                rows,
                total: sumDataWithCommonKeys(rows, 'Total', 'Child Under 5'),
            };
        });

    it('splits 0-5 off 6-23 for South Sudan OTP, totals included', () => {
        const { rows, total } = tableOf('southSudan', 'OTP');
        expect(rows[0].under6).toEqual([1, 0]);
        expect(rows[0].between6And23).toEqual([1, 0]);
        expect(total.under6).toEqual([1, 0]);
        expect(total.between6And23).toEqual([2, 0]);
        expect(total.between24And59).toEqual([1, 0]);
    });

    it.each([
        ['southSudan', 'TSFP'],
        ['bangladesh', 'OTP'],
    ])('keeps 0-5 inside 6-23 for %s %s', (country, program) => {
        const { rows, total } = tableOf(country, program);
        expect(rows[0].under6).toBeUndefined();
        expect(rows[0].between6And23).toEqual([2, 0]);
        expect(total.under6).toBeUndefined();
        expect(total.between6And23).toEqual([3, 0]);
    });
});
