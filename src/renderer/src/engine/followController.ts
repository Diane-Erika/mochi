import { useAnimationStore } from './animationStore'
import { pickAmbientAnimation } from './animationController'
import { PET_SIZE } from '../../../shared/petSize'

const STEP_MS = 33 // ~30fps, matches movementController's cadence

const ENTER_RADIUS = 140 // cursor distance (px) that starts noticing the cursor
const EXIT_RADIUS = 200 // cursor distance (px) that ends alert/chase (hysteresis vs ENTER_RADIUS)
const STOP_RADIUS = 32 // stop closing the gap once this close, so mochi doesn't sit on the pointer
const MAX_SPEED = 4 // pixels per step, caps the chase speed
const EASE_FACTOR = 0.08 // fraction of remaining distance closed per step
const DIRECTION_DEADZONE = 4 // px, avoids sprite-flip flicker while nearly stationary

const SHAKE_WINDOW = 18 // samples (~600ms at STEP_MS) of cursor.x history to look for shaking in
const SHAKE_NOISE_FLOOR = 2 // px, ignores sub-pixel jitter when counting direction reversals
const SHAKE_REVERSALS_THRESHOLD = 4 // reversals within the window to count as "shaking"

const ALERT_PATIENCE_MS = 2000 // how long mochi stares at a motionless cursor before losing interest
const CURSOR_MOVE_EPSILON = 2 // px, cursor travel below this counts as holding still

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function countReversals(samples: number[]): number {
    let reversals = 0
    let lastSign = 0
    for (let i = 1; i < samples.length; i++) {
        const delta = samples[i] - samples[i - 1]
        if (Math.abs(delta) < SHAKE_NOISE_FLOOR) continue
        const sign = delta > 0 ? 1 : -1
        if (lastSign !== 0 && sign !== lastSign) reversals++
        lastSign = sign
    }
    return reversals
}

export function startFollowController(): () => void {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    const cursorXHistory: number[] = []

    let lastCursor: { x: number; y: number } | null = null
    let stillSince = Date.now() // reset whenever the cursor moves, or when a fresh alert starts
    let boredOfCursor = false // stops re-alerting on the same motionless cursor

    async function tick(): Promise<void> {
        if (stopped) return

        const [cursor, pos] = await Promise.all([
            window.api.getCursorPoint(),
            window.api.getPosition(),
        ])

        const now = Date.now()
        if (
            !lastCursor ||
            Math.hypot(cursor.x - lastCursor.x, cursor.y - lastCursor.y) > CURSOR_MOVE_EPSILON
        ) {
            lastCursor = cursor
            stillSince = now
            boredOfCursor = false
        }

        const centerX = pos.x + PET_SIZE / 2
        const centerY = pos.y + PET_SIZE / 2
        const dx = cursor.x - centerX
        const dy = cursor.y - centerY
        const distance = Math.hypot(dx, dy)

        cursorXHistory.push(cursor.x)
        if (cursorXHistory.length > SHAKE_WINDOW) cursorXHistory.shift()
        const shaking = countReversals(cursorXHistory) >= SHAKE_REVERSALS_THRESHOLD

        const { current, play, setDirection, setVerticalDirection } = useAnimationStore.getState()
        const noticing = current === 'alert' || current === 'follow'

        if (!noticing && distance <= ENTER_RADIUS && !boredOfCursor) {
            play('alert')
            stillSince = now // a fresh alert always gets the full patience window
        } else if (noticing && distance > EXIT_RADIUS) {
            play('walk')
        } else if (current === 'alert') {
            if (Math.abs(dx) > DIRECTION_DEADZONE) setDirection(dx > 0 ? 1 : -1)
            if (shaking) {
                play('follow')
            } else if (now - stillSince >= ALERT_PATIENCE_MS) {
                boredOfCursor = true
                play(pickAmbientAnimation())
            }
        } else if (current === 'follow' && distance > STOP_RADIUS) {
            const stepX = clamp(dx * EASE_FACTOR, -MAX_SPEED, MAX_SPEED)
            const stepY = clamp(dy * EASE_FACTOR, -MAX_SPEED, MAX_SPEED)

            if (Math.abs(dx) > DIRECTION_DEADZONE) setDirection(dx > 0 ? 1 : -1)
            if (Math.abs(dy) > DIRECTION_DEADZONE) setVerticalDirection(dy > 0 ? 1 : -1)

            await Promise.all([window.api.moveBy(stepX), window.api.moveByY(stepY)])
        }

        if (!stopped) timer = setTimeout(tick, STEP_MS)
    }

    tick()
    return () => {
        stopped = true
        clearTimeout(timer)
    }
}
