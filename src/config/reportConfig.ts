import type { ReactNode } from 'react';
import { ChildrenUnder5 } from '../report/ChildrenUnder5';
import { MainReport } from '../report/MainReport';
import { PBWGMainReport } from '../report/PBWG/PBWGMainReport';
import { MedicalChildrenUnder5Report } from '../report/MedicalChildrenUnder5Report';
import { PBWGMedicalReport } from '../report/PBWG/PBWGMedicalReport';
import { ERegistry } from '../report/ERegistry';
import { FolloWupCategories } from '../report/FollowUpCategories';
import { PBWGFollowUpCategories } from '../report/PBWG/PBWGFollowUpCategories';
import { ScreeningData } from '../report/ScreeningData';
import { FoodItems } from '../report/stock/FoodItems';
import { countryConfig } from './country';
import Form from '../entity/Form';

// This file is the one place a different project swaps in its own
// beneficiary types, programs and reports — App.tsx itself doesn't know
// about "TSFP", "BSFP", "PBWG" or any report component; it only walks this
// tree and calls `render` once the navigation reaches a report option.

// Everything a report's `render` needs, reflecting the app's navigation
// state at the point the report is ready to be shown.
export interface ReportContext {
    entities: any[];
    // Every submission, flat and unfiltered by entity type — for reports
    // that don't fit the "beneficiary with visits" shape (e.g. Screening).
    forms: Form[];
    startDate: Date;
    endDate: Date;
    program: string;
    reportType: string;
    entityType: string;
    category: string;
    physiologyStatus: string | null;
}

export interface ReportOption {
    // Value stored in the `reportType` state; also this option's React key.
    key: string;
    // Button label on the "choose the report type" screen.
    label: string;
    // Show the beneficiary-category filter alongside the report.
    needsCategory?: boolean;
    // Require a physiology status (pregnant/breastfeeding) to be chosen
    // before the report can render.
    needsPhysiologyStatus?: boolean;
    render: (context: ReportContext) => ReactNode;
}

export interface ProgramOption {
    // Value stored in the `program` state; also this option's React key.
    key: string;
    // Button label on the "choose the program" screen.
    label: string;
    reportOptions?: ReportOption[];
}

export interface EntityTypeOption {
    // Value stored in the `entityType` state; also this option's React key.
    key: string;
    // Button label on the "choose beneficiary type" screen.
    label: string;
    // When present, the app asks for a program from this list before
    // showing the report-type screen (e.g. Child Under 5: TSFP/OTP/BSFP).
    // When absent, `reportOptions` is used directly with no program step
    // (e.g. PBWG).
    programs?: ProgramOption[];
    reportOptions?: ReportOption[];
}

export const reportConfig: EntityTypeOption[] = [
    {
        key: 'Child Under 5',
        label: 'Children under 5',
        programs: [
            {
                key: 'TSFP',
                label: 'TSFP',
                reportOptions: [
                    {
                        key: 'TSFP',
                        label: 'Main Report',
                        render: context =>
                            ChildrenUnder5(
                                context.entities,
                                context.startDate,
                                context.endDate,
                                context.program,
                                context.entityType,
                            ),
                    },
                    {
                        key: 'medical_TSFP',
                        label: 'Medical Report',
                        render: context =>
                            MedicalChildrenUnder5Report(
                                context.entities,
                                context.startDate,
                                context.endDate,
                                context.program,
                            ),
                    },
                    {
                        key: 'TSFP_followup_category',
                        label: 'Followup category',
                        needsCategory: true,
                        render: context =>
                            FolloWupCategories(
                                context.category,
                                context.program,
                                context.entities,
                                context.startDate,
                                context.endDate,
                                context.entityType,
                            ),
                    },
                    {
                        key: 'TSFP_eRegister',
                        label: 'eRegister',
                        render: context =>
                            ERegistry(
                                context.program,
                                context.entities,
                                context.startDate,
                                context.endDate,
                                'Child Under 5',
                                '',
                            ),
                    },
                ],
            },
            {
                key: 'OTP',
                label: 'OTP',
                reportOptions: [
                    {
                        key: 'OTP',
                        label: 'Main Report',
                        render: context =>
                            ChildrenUnder5(
                                context.entities,
                                context.startDate,
                                context.endDate,
                                context.program,
                                context.entityType,
                            ),
                    },
                    {
                        key: 'medical_OTP',
                        label: 'Medical Report',
                        render: context =>
                            MedicalChildrenUnder5Report(
                                context.entities,
                                context.startDate,
                                context.endDate,
                                context.program,
                            ),
                    },
                    {
                        key: 'OTP_followup_category',
                        label: 'Followup category',
                        needsCategory: true,
                        render: context =>
                            FolloWupCategories(
                                context.category,
                                context.program,
                                context.entities,
                                context.startDate,
                                context.endDate,
                                context.entityType,
                            ),
                    },
                    {
                        key: 'OTP_eRegister',
                        label: 'eRegister',
                        render: context =>
                            ERegistry(
                                context.program,
                                context.entities,
                                context.startDate,
                                context.endDate,
                                'Child Under 5',
                                '',
                            ),
                    },
                ],
            },
            {
                key: 'BSFP',
                label: 'BSFP',
                reportOptions: [
                    {
                        key: 'BSFP',
                        label: 'Main Report',
                        // Bangladesh's BSFP reports in the same shape as
                        // NSEP (same admission types, no criteria
                        // breakdown) — countryConfig.bsfpnsepAdmissionTypesByCategory
                        // is only defined there, so South Sudan's BSFP
                        // (which has no bsfp_child_visit/bsfp_child_followup_visit
                        // forms) keeps its simpler MainReport unchanged.
                        render: context =>
                            countryConfig.bsfpnsepAdmissionTypesByCategory
                                ? ChildrenUnder5(
                                      context.entities,
                                      context.startDate,
                                      context.endDate,
                                      context.program,
                                      context.entityType,
                                      countryConfig.bsfpnsepAdmissionTypesByCategory,
                                      // BSFP's assistance_given field only
                                      // ever takes these 3 values, and all
                                      // 3 share one quantity field (unlike
                                      // NSEP's per-type field names).
                                      ['lns_mq', 'wsbp', 'rusf'],
                                      'ration_quantity',
                                  )
                                : MainReport(
                                      context.entities,
                                      context.startDate,
                                      context.endDate,
                                      context.program,
                                      context.entityType,
                                  ),
                    },
                    {
                        key: 'BSFP_followup_category',
                        label: 'Followup category',
                        needsCategory: true,
                        render: context =>
                            FolloWupCategories(
                                context.category,
                                context.program,
                                context.entities,
                                context.startDate,
                                context.endDate,
                                context.entityType,
                            ),
                    },
                ],
            },
            {
                key: 'NSEP',
                label: 'NSEP',
                reportOptions: [
                    {
                        key: 'NSEP',
                        label: 'Main Report',
                        render: context =>
                            ChildrenUnder5(
                                context.entities,
                                context.startDate,
                                context.endDate,
                                context.program,
                                context.entityType,
                                countryConfig.bsfpnsepAdmissionTypesByCategory,
                                // NSEP's ration_type field only ever takes
                                // these 5 values — narrower than the
                                // default ration list other programs show.
                                ['rusf', 'wsbp', 'lns_mq', 'cash_voucher', 'in_kind'],
                            ),
                    },
                    {
                        key: 'NSEP_followup_category',
                        label: 'Followup category',
                        needsCategory: true,
                        render: context =>
                            FolloWupCategories(
                                context.category,
                                context.program,
                                context.entities,
                                context.startDate,
                                context.endDate,
                                context.entityType,
                            ),
                    },
                ],
            },
        ],
    },
    {
        key: 'PBWG',
        label: 'Pregnant and breastfeeding women and girls',
        reportOptions: [
            {
                key: 'TSFP',
                label: 'Main Report',
                render: context =>
                    PBWGMainReport(
                        context.entities,
                        context.startDate,
                        context.endDate,
                        context.reportType,
                        context.entityType,
                    ),
            },
            {
                key: 'medical',
                label: 'Medical',
                render: context =>
                    PBWGMedicalReport(
                        context.entities,
                        context.startDate,
                        context.endDate,
                        'TSFP',
                    ),
            },
            {
                key: 'PBWG_followup',
                label: 'Followup category',
                needsCategory: true,
                needsPhysiologyStatus: true,
                render: context => {
                    // `needsPhysiologyStatus` guarantees this is set before
                    // App.tsx ever calls render.
                    if (!context.physiologyStatus) return null;
                    return PBWGFollowUpCategories(
                        context.category,
                        'TSFP',
                        context.entities,
                        context.startDate,
                        context.endDate,
                        context.entityType,
                        context.physiologyStatus,
                    );
                },
            },
            {
                key: 'PBWG_eRegister',
                label: 'eRegister',
                needsPhysiologyStatus: true,
                render: context => {
                    // `needsPhysiologyStatus` guarantees this is set before
                    // App.tsx ever calls render.
                    if (!context.physiologyStatus) return null;
                    return ERegistry(
                        'TSFP',
                        context.entities?.filter(
                            (entity: any) =>
                                entity?.profile?.values?.physiology_status ===
                                context.physiologyStatus,
                        ),
                        context.startDate,
                        context.endDate,
                        context.entityType,
                        context.physiologyStatus,
                    );
                },
            },
        ],
    },
    {
        key: 'SCREENING',
        label: 'Screening Data',
        reportOptions: [
            {
                key: 'screening_tally',
                label: 'Screening Tally Report',
                render: context =>
                    ScreeningData({
                        submissions: context.forms.filter(form =>
                            countryConfig.screeningForms.includes(
                                form.formFormId,
                            ),
                        ),
                        startDate: context.startDate,
                        endDate: context.endDate,
                    }),
            },
        ],
    },
    {
        key: 'STOCK',
        label: 'Stock Data',
        reportOptions:[
            {
                key: 'FOOD_ITEM',
                label: 'Food item',
                render: context => FoodItems({
                    submissions: context.forms.filter(form =>
                            countryConfig.stockForms.includes(
                                form.formFormId,
                            ),
                        ),
                        startDate: context.startDate,
                        endDate: context.endDate,
                })
            },
            {
                key: 'NON_FOOD_ITEM',
                label: 'Non Food item',
                render: function (context: ReportContext): ReactNode {
                    throw new Error('Function not implemented.');
                }
            }
        ]
    }
];
