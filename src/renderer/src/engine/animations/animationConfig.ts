import idleSheet from '@renderer/assets/sprites/mochi_idle.png'

export interface AnimationConfig {
    src: string
    frameCount: number
    frameWidth: number
    frameHeight: number
    fps: number
    loop: boolean
}

export const ANIMATIONS: Record<string, AnimationConfig> = {
    // Geometry here must match sprites/manifest.json — run `npm run sprites`
    // after changing a cell size there.
    idle: {
        src: idleSheet,
        frameCount: 4,
        frameWidth: 64,
        frameHeight: 64,
        fps: 4,
        loop: true,
    },
}
