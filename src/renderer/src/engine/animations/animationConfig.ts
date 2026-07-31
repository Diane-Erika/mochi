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
    idle: {
        src: idleSheet,
        frameCount: 4,
        frameWidth: 60,
        frameHeight: 60,
        fps: 4,
        loop: true,
    },
}
