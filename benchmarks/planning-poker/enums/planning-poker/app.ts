/** Application routes observed in the Planning Poker subject. */
export enum AppRoutes {
    HEALTH = '/api/health',
    HOME = '/',
}

/** Stable user-facing labels observed during browser exploration. */
export enum UiText {
    ADD_STORY = 'Adicionar',
    BEGIN_ESTIMATION = 'Estimar',
    CREATE_ROOM = 'Criar sala',
    ESTIMATING = 'Escolhendo cartas',
    EXPORT_CSV = 'Exportar CSV',
    JOIN_ROOM = 'Entrar na sala',
    JOIN_WITH_CODE = 'Entrar com código',
    NEW_STORY = '+ Novo story',
    REVEALED = 'Cartas reveladas',
    ROOM_CODE_TITLE = 'Copiar código da sala',
    SAVE_CONSENSUS = 'Salvar consenso',
    SESSION_SUMMARY = 'Resumo da sessão',
}

/** Feedback messages rendered by the Planning Poker subject. */
export enum FeedbackMessages {
    NAME_ALREADY_IN_USE = 'Nome já em uso nesta sala',
    ROOM_NOT_FOUND = 'Sala não encontrada',
    UNAUTHORIZED = 'Acesso restrito ao responsável pela sala',
}

/** Cards used by the critical benchmark scenario. */
export enum PlanningPokerCard {
    FIVE = '5',
    EIGHT = '8',
}
