import { useAnimationStore } from '../engine/animationStore'
import { ANIMATIONS } from '@renderer/engine/animations/animationConfig'
import { useEffect } from 'react'

export function useSpriteAnimation() {
    const current = useAnimationStore((s) => s.current)
    const frame = useAnimationStore((s) => s.frame)
    const advanceFrame = useAnimationStore((s) => s.advanceFrame)
    const config = ANIMATIONS[current]

    useEffect(() => {
        if (!config) return
        const id = setInterval(() => advanceFrame(config.frameCount), 1000 / config.fps)
        return () => clearInterval(id)
    }, [config, advanceFrame])

    return { frame, config }
}
