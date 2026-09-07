import type { Locator, Page } from '@playwright/test';
import {
    AppRoutes,
    FeedbackMessages,
    UiText,
} from '../../enums/planning-poker/app';

export class HomePage {
    constructor(private readonly page: Page) {}

    // ==================== Interactive Locators ====================

    get heading(): Locator {
        return this.page.getByRole('heading', { name: 'Planning Poker' });
    }

    get creatorNameInput(): Locator {
        return this.page.getByLabel('Seu nome');
    }

    get passwordInput(): Locator {
        return this.page.getByLabel('Senha da sala');
    }

    get joinWithCodeButton(): Locator {
        return this.page.getByRole('button', {
            name: UiText.JOIN_WITH_CODE,
        });
    }

    get roomCodeInput(): Locator {
        return this.page.getByLabel('Código da sala');
    }

    get joinRoomButton(): Locator {
        return this.page.getByRole('button', {
            exact: true,
            name: UiText.JOIN_ROOM,
        });
    }

    // ==================== Feedback Locators ====================

    get roomNotFoundError(): Locator {
        return this.page.getByText(FeedbackMessages.ROOM_NOT_FOUND, {
            exact: true,
        });
    }

    get nameAlreadyInUseError(): Locator {
        return this.page.getByText(FeedbackMessages.NAME_ALREADY_IN_USE, {
            exact: true,
        });
    }

    // ==================== Actions ====================

    /**
     * Opens the application home route.
     * @returns {Promise<void>} Resolves after DOM content is available.
     */
    async open(): Promise<void> {
        await this.page.goto(AppRoutes.HOME, { waitUntil: 'domcontentloaded' });
    }

    /**
     * Submits room creation through the form's keyboard behavior.
     * @param {string} creatorName - Unique display name for the room owner.
     * @param {string} password - Password being exercised by the scenario.
     * @returns {Promise<void>} Resolves after the submit key is dispatched.
     */
    async createRoom(creatorName: string, password: string): Promise<void> {
        await this.creatorNameInput.fill(creatorName);
        await this.passwordInput.fill(password);
        await this.passwordInput.press('Enter');
    }

    /**
     * Joins an existing room from the join tab.
     * @param {string} roomCode - Five-character room code shown to the host.
     * @param {string} participantName - Unique participant display name.
     * @returns {Promise<void>} Resolves after the join action is dispatched.
     */
    async joinRoom(
        roomCode: string,
        participantName: string,
    ): Promise<void> {
        await this.joinWithCodeButton.click();
        await this.roomCodeInput.fill(roomCode);
        await this.creatorNameInput.fill(participantName);
        await this.joinRoomButton.click();
    }
}
