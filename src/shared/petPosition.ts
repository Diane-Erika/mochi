/**
 * Shared between the main and renderer processes.
 *
 * The main process owns the window rect, so it also owns clamping. It reports
 * position back as an altitude — pixels above the bottom of the work area —
 * so the renderer can reason about height without knowing where that work
 * area begins on this display.
 */
export interface PetPosition {
    x: number
    y: number
    /** Pixels above the bottom of the work area; 0 is the ground. */
    altitude: number
    /** Highest altitude this display allows. */
    maxAltitude: number
    atLeft: boolean
    atRight: boolean
    atGround: boolean
    atCeiling: boolean
}
