import type { Download, Locator, Page } from '@playwright/test';
import {
    FeedbackMessages,
    PlanningPokerCard,
    UiText,
} from '../../enums/planning-poker/app';

export class RoomPage {
    constructor(private readonly page: Page) {}

    // ==================== Interactive Locators ====================

    get roomCodeButton(): Locator {
        return this.page.getByTitle(UiText.ROOM_CODE_TITLE);
    }

    get newStoryButton(): Locator {
        return this.page.getByRole('button', {
            exact: true,
            name: UiText.NEW_STORY,
        });
    }

    get storyTitleInput(): Locator {
        return this.page.getByPlaceholder('Título do story');
    }

    get storyDescriptionInput(): Locator {
        return this.page.getByPlaceholder(
            'Descrição / critérios de aceite (opcional)',
        );
    }

    get addStoryButton(): Locator {
        return this.page.getByRole('button', {
            exact: true,
            name: UiText.ADD_STORY,
        });
    }

    get saveConsensusButton(): Locator {
        return this.page.getByRole('button', {
            exact: true,
            name: UiText.SAVE_CONSENSUS,
        });
    }

    get sessionSummaryButton(): Locator {
        return this.page.getByRole('button', {
            exact: true,
            name: UiText.SESSION_SUMMARY,
        });
    }

    get exportCsvButton(): Locator {
        return this.page.getByRole('button', { name: UiText.EXPORT_CSV });
    }

    onlineCount(count: number): Locator {
        return this.page.getByText(`${count} online`, { exact: true });
    }

    storyItem(storyTitle: string): Locator {
        return this.page
            .getByRole('listitem')
            .filter({ hasText: storyTitle });
    }

    phaseStatus(status: UiText.ESTIMATING | UiText.REVEALED): Locator {
        return this.page.getByRole('main').getByText(status, { exact: true });
    }

    selectionProgress(selected: number, participants: number): Locator {
        return this.page
            .getByRole('main')
            .getByText(`${selected} de ${participants} escolheram`, {
                exact: true,
            });
    }

    revealedParticipant(participantName: string, isHost = false): Locator {
        const visibleName = isHost
            ? `${participantName} 👑`
            : participantName;

        return this.page
            .getByRole('main')
            .getByText(visibleName, { exact: true });
    }

    summaryRow(storyTitle: string): Locator {
        return this.page.getByRole('row').filter({ hasText: storyTitle });
    }

    // ==================== Feedback Locators ====================

    get unauthorizedNotice(): Locator {
        return this.page.getByText(FeedbackMessages.UNAUTHORIZED, {
            exact: true,
        });
    }

    // ==================== Actions ====================

    /**
     * Reads the room code exposed by the copy-code control.
     * @returns {Promise<string>} The normalized five-character room code.
     */
    async getRoomCode(): Promise<string> {
        return (await this.roomCodeButton.innerText()).trim();
    }

    /**
     * Adds a story to the room backlog.
     * @param {string} title - Unique story title.
     * @param {string} description - Story description or acceptance context.
     * @returns {Promise<void>} Resolves after the add action is dispatched.
     */
    async addStory(title: string, description: string): Promise<void> {
        await this.newStoryButton.click();
        await this.storyTitleInput.fill(title);
        await this.storyDescriptionInput.fill(description);
        await this.addStoryButton.click();
    }

    /**
     * Starts estimation for a named story.
     * @param {string} storyTitle - Story whose estimation round should start.
     * @returns {Promise<void>} Resolves after the start action is dispatched.
     */
    async startEstimation(storyTitle: string): Promise<void> {
        await this.storyItem(storyTitle)
            .getByRole('button', {
                exact: true,
                name: UiText.BEGIN_ESTIMATION,
            })
            .click();
    }

    /**
     * Selects an estimation card in the active round.
     * @param {PlanningPokerCard} card - Card value selected by the participant.
     * @returns {Promise<void>} Resolves after the selection is dispatched.
     */
    async selectCard(card: PlanningPokerCard): Promise<void> {
        await this.page
            .getByRole('main')
            .getByRole('button', { exact: true, name: card })
            .click();
    }

    /**
     * Selects and saves the final consensus value.
     * @param {PlanningPokerCard} card - Consensus card selected by the host.
     * @returns {Promise<void>} Resolves after consensus is dispatched.
     */
    async saveConsensus(card: PlanningPokerCard): Promise<void> {
        await this.page
            .getByRole('main')
            .getByRole('button', { exact: true, name: card })
            .click();
        await this.saveConsensusButton.click();
    }

    /**
     * Opens the session summary view.
     * @returns {Promise<void>} Resolves after the view action is dispatched.
     */
    async openSessionSummary(): Promise<void> {
        await this.sessionSummaryButton.click();
    }

    /**
     * Starts the authenticated CSV export and captures the browser download.
     * @returns {Promise<Download>} The completed Playwright download handle.
     */
    async exportCsv(): Promise<Download> {
        const downloadPromise = this.page.waitForEvent('download');
        await this.exportCsvButton.click();
        return downloadPromise;
    }
}
