export type PasswordBoundaryCase = {
    caseId: string;
    description: string;
    password: string;
};

export const BELOW_MINIMUM_PASSWORD = {
    caseId: 'TC-PASS-5',
    description: 'a five-character password',
    password: '12345',
} as const satisfies PasswordBoundaryCase;

export const VALID_PASSWORD_BOUNDARIES = [
    {
        caseId: 'TC-PASS-6',
        description: 'the exact six-character minimum',
        password: '123456',
    },
    {
        caseId: 'TC-PASS-7',
        description: 'the seven-character valid neighbor',
        password: '1234567',
    },
] as const satisfies readonly PasswordBoundaryCase[];
