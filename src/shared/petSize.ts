/**
 * Shared between the main and renderer processes.
 *
 * The window is sized to the sprite so that window bounds and the visible pet
 * are the same rectangle — edge clamping in the main process then refers to the
 * dog rather than to a mostly-empty box around it.
 */
export const SPRITE_SIZE = 64
export const PET_SCALE = 1
export const PET_SIZE = SPRITE_SIZE * PET_SCALE
