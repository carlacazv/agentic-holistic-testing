import { en, Faker } from '@faker-js/faker';
import { z } from 'zod';
import { PlanningPokerCard } from '../../../enums/planning-poker/app';

const RoomCreationDataSchema = z.strictObject({
    creatorName: z.string().min(1),
    password: z.string().min(1),
});

const PlanningPokerScenarioSchema = z.strictObject({
    host: RoomCreationDataSchema,
    participantName: z.string().min(1),
    story: z.strictObject({
        title: z.string().min(1),
        description: z.string().min(1),
    }),
    hostVote: z.enum(PlanningPokerCard),
    participantVote: z.enum(PlanningPokerCard),
    consensus: z.enum(PlanningPokerCard),
});

export type RoomCreationData = z.output<typeof RoomCreationDataSchema>;
export type PlanningPokerScenario = z.output<
    typeof PlanningPokerScenarioSchema
>;

export type RoomCreationFactoryOptions = {
    creatorLabel: string;
    password: string;
    seed: number;
};

function scopedFaker(seed: number): Faker {
    const generatedData = new Faker({ locale: [en] });
    generatedData.seed(seed);
    return generatedData;
}

/**
 * Generates unique, reproducible room-creation data for a test repetition.
 * @param {RoomCreationFactoryOptions} options - Seed, label, and tested password.
 * @returns {RoomCreationData} Schema-validated room data.
 */
export function generateRoomCreationData(
    options: RoomCreationFactoryOptions,
): RoomCreationData {
    const generatedData = scopedFaker(options.seed);

    return RoomCreationDataSchema.parse({
        creatorName: `${options.creatorLabel}-${generatedData.string.alphanumeric(8).toUpperCase()}`,
        password: options.password,
    });
}

/**
 * Generates the complete critical-path scenario with deterministic Faker data.
 * @param {number} seed - Stable seed for the current Playwright repetition.
 * @returns {PlanningPokerScenario} Schema-validated scenario data.
 */
export function generatePlanningPokerScenario(
    seed: number,
): PlanningPokerScenario {
    const generatedData = scopedFaker(seed);
    const suffix = generatedData.string.alphanumeric(8).toUpperCase();

    return PlanningPokerScenarioSchema.parse({
        host: {
            creatorName: `Host-${suffix}`,
            password: generatedData.internet.password({ length: 12 }),
        },
        participantName: `Participant-${generatedData.string.alphanumeric(8).toUpperCase()}`,
        story: {
            title: `Story-${generatedData.string.alphanumeric(10).toUpperCase()}`,
            description: `Acceptance-${generatedData.string.alphanumeric(16)}`,
        },
        hostVote: PlanningPokerCard.FIVE,
        participantVote: PlanningPokerCard.EIGHT,
        consensus: PlanningPokerCard.EIGHT,
    });
}
