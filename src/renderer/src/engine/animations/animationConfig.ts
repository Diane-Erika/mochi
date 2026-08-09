import idleSheet from '@renderer/assets/sprites/mochi_idle.png'
import walkSheet from '@renderer/assets/sprites/mochi_walk.png'
import flySheet from '@renderer/assets/sprites/mochi_fly.png'
import alertSheet from '@renderer/assets/sprites/mochi_alert.png'

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
        fps: 2,
        loop: true,
    },
    walk: {
        src: walkSheet,
        frameCount: 3,
        frameWidth: 64,
        frameHeight: 64,
        fps: 4,
        loop: true,
    },
    // Placeholder: reuses walk's sheet until real fly art exists.
    fly: {
        src: flySheet,
        frameCount: 4,
        frameWidth: 64,
        frameHeight: 64,
        fps: 4,
        loop: true,
    },
    // Placeholder: reuses walk's sheet until real follow/chase art exists.
    follow: {
        src: walkSheet,
        frameCount: 3,
        frameWidth: 64,
        frameHeight: 64,
        fps: 4,
        loop: true,
    },
    alert: {
        src: alertSheet,
        frameCount: 1,
        frameWidth: 64,
        frameHeight: 64,
        fps: 1,
        loop: false,
    },
}
