import { expect, test } from '../../../fixtures/pom/test-options';
import { UiText } from '../../../enums/planning-poker/app';
import { generatePlanningPokerScenario } from '../../../test-data/factories/planning-poker/scenario.factory';

test.describe('Given a distributed team in a Planning Poker room', () => {
    test(
        'should preserve vote privacy, synchronize consensus, and export the result',
        {
            tag: '@e2e',
            annotation: {
                type: 'test_case',
                description: 'TC-JOURNEY',
            },
        },
        async ({ teamSession }, testInfo) => {
            const scenario = generatePlanningPokerScenario(
                testInfo.repeatEachIndex,
            );
            teamSession.trackCreatorName(scenario.host.creatorName);

            const roomCode = await test.step(
                'GIVEN a host creates an isolated room',
                async () => {
                    await teamSession.host.homePage.open();
                    await teamSession.host.homePage.createRoom(
                        scenario.host.creatorName,
                        scenario.host.password,
                    );

                    await expect(
                        teamSession.host.roomPage.onlineCount(1),
                    ).toBeVisible();

                    const code =
                        await teamSession.host.roomPage.getRoomCode();
                    expect(code).toMatch(/^[A-Z0-9]{5}$/);
                    return code;
                },
            );

            await test.step(
                'GIVEN an independent participant joins the room',
                async () => {
                    await teamSession.participant.homePage.open();
                    await teamSession.participant.homePage.joinRoom(
                        roomCode,
                        scenario.participantName,
                    );

                    await expect(
                        teamSession.host.roomPage.onlineCount(2),
                    ).toBeVisible();
                    await expect(
                        teamSession.participant.roomPage.onlineCount(2),
                    ).toBeVisible();
                },
            );

            await test.step(
                'WHEN the host adds a story and starts estimation',
                async () => {
                    await teamSession.host.roomPage.addStory(
                        scenario.story.title,
                        scenario.story.description,
                    );
                    await expect(
                        teamSession.participant.roomPage.storyItem(
                            scenario.story.title,
                        ),
                    ).toBeVisible();

                    await teamSession.host.roomPage.startEstimation(
                        scenario.story.title,
                    );
                    await expect(
                        teamSession.participant.roomPage.phaseStatus(
                            UiText.ESTIMATING,
                        ),
                    ).toBeVisible();
                },
            );

            await test.step('WHEN only the host has voted', async () => {
                await teamSession.host.roomPage.selectCard(
                    scenario.hostVote,
                );
            });

            await test.step(
                'THEN the participant sees progress but not the host vote',
                async () => {
                    await expect(
                        teamSession.participant.roomPage.selectionProgress(
                            1,
                            2,
                        ),
                    ).toBeVisible();
                    await expect(
                        teamSession.participant.roomPage.revealedParticipant(
                            scenario.host.creatorName,
                            true,
                        ),
                    ).toHaveCount(0);
                },
            );

            await test.step(
                'WHEN the participant casts the final vote',
                async () => {
                    await teamSession.participant.roomPage.selectCard(
                        scenario.participantVote,
                    );
                },
            );

            await test.step(
                'THEN both clients reveal the same completed round',
                async () => {
                    await expect(
                        teamSession.host.roomPage.phaseStatus(UiText.REVEALED),
                    ).toBeVisible();
                    await expect(
                        teamSession.participant.roomPage.phaseStatus(
                            UiText.REVEALED,
                        ),
                    ).toBeVisible();
                    await expect(
                        teamSession.host.roomPage.revealedParticipant(
                            scenario.participantName,
                        ),
                    ).toBeVisible();
                    await expect(
                        teamSession.participant.roomPage.revealedParticipant(
                            scenario.host.creatorName,
                            true,
                        ),
                    ).toBeVisible();
                },
            );

            await test.step(
                'WHEN the host saves the consensus and opens the summary',
                async () => {
                    await teamSession.host.roomPage.saveConsensus(
                        scenario.consensus,
                    );
                    await teamSession.host.roomPage.openSessionSummary();
                },
            );

            await test.step(
                'THEN the summary contains the agreed estimate',
                async () => {
                    await expect(
                        teamSession.host.roomPage.summaryRow(
                            scenario.story.title,
                        ),
                    ).toContainText(scenario.consensus);
                },
            );

            const download = await test.step(
                'WHEN the authenticated host exports the session',
                async () => teamSession.host.roomPage.exportCsv(),
            );

            await test.step(
                'THEN the browser receives the room-specific CSV',
                async () => {
                    expect(await download.failure()).toBeNull();
                    expect(download.suggestedFilename()).toBe(
                        `planning-poker-${roomCode}.csv`,
                    );
                },
            );
        },
    );
});
