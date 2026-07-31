import { JSX } from 'react/jsx-runtime'
import mochi from '../assets/sprites/mochi.png'
import { useSpriteAnimation } from '@renderer/hooks/useSpriteAnimation'

export function Pet(): JSX.Element {
    const { frame, config } = useSpriteAnimation()
    const scale = 1
    return (
        <>
            {/* <div>
                <img src={mochi} alt="Mochi" style={{ width: 100, height: 100 }} />
            </div> */}
            <div
                style={{
                    width: config.frameWidth * scale,
                    height: config.frameHeight * scale,
                    backgroundImage: `url(${config.src})`,
                    backgroundSize: `${config.frameCount * config.frameWidth * scale}px ${config.frameHeight * scale}px`,
                    backgroundPosition: `${-frame * config.frameWidth * scale}px 0px`,
                    imageRendering: 'pixelated',
                }}
            />
        </>
    )
}
