import { expect, test } from '../../../fixtures/pom/test-options';
import { generateRoomCreationData } from '../../../test-data/factories/planning-poker/scenario.factory';
import {
    BELOW_MINIMUM_PASSWORD,
    VALID_PASSWORD_BOUNDARIES,
} from '../../../test-data/static/planning-poker/password-boundaries';

test.describe('Given room-creation password boundaries', () => {
    test.beforeEach(async ({ homePage }) => {
        await homePage.open();
    });

    test(
        `should reject ${BELOW_MINIMUM_PASSWORD.description}`,
        {
            tag: '@regression',
            annotation: {
                type: 'test_case',
                description: BELOW_MINIMUM_PASSWORD.caseId,
            },
        },
        async ({ homePage, roomCleanup, roomPage }, testInfo) => {
            const room = generateRoomCreationData({
                creatorLabel: BELOW_MINIMUM_PASSWORD.caseId,
                password: BELOW_MINIMUM_PASSWORD.password,
                seed: testInfo.repeatEachIndex,
            });
            roomCleanup.trackCreatorName(room.creatorName);

            await test.step(
                'WHEN the user submits the value immediately below the minimum',
                async () => {
                    await homePage.createRoom(
                        room.creatorName,
                        room.password,
                    );
                },
            );

            await test.step(
                'THEN room creation remains blocked',
                async () => {
                    await expect(homePage.passwordInput).toHaveValue(
                        room.password,
                    );
                    await expect(roomPage.roomCodeButton).toHaveCount(0);
                },
            );
        },
    );

    for (const boundary of VALID_PASSWORD_BOUNDARIES) {
        test(
            `should accept ${boundary.description}`,
            {
                tag: '@regression',
                annotation: {
                    type: 'test_case',
                    description: boundary.caseId,
                },
            },
            async ({ homePage, roomCleanup, roomPage }, testInfo) => {
                const room = generateRoomCreationData({
                    creatorLabel: boundary.caseId,
                    password: boundary.password,
                    seed: testInfo.repeatEachIndex,
                });
                roomCleanup.trackCreatorName(room.creatorName);

                await test.step(
                    `WHEN the user submits ${boundary.description}`,
                    async () => {
                        await homePage.createRoom(
                            room.creatorName,
                            room.password,
                        );
                    },
                );

                await test.step(
                    'THEN the room is created for the valid password',
                    async () => {
                        await expect(roomPage.roomCodeButton).toBeVisible();
                        await expect(roomPage.onlineCount(1)).toBeVisible();
                    },
                );
            },
        );
    }
});
