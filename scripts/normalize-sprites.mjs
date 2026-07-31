/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * Normalizes AI-generated sprite sheets into a fixed grid.
 *
 * AI image models don't emit grid-aligned sheets: cell widths drift and the
 * subject floats to a different height in each frame. This treats the raw PNG
 * as art, then rebuilds it on an exact grid with one consistent anchor so the
 * sprite doesn't bob during playback.
 *
 *   node scripts/normalize-sprites.mjs [--debug] [name ...]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SPRITES = join(ROOT, 'sprites')
const ALPHA_THRESHOLD = 8
const DEBUG_SCALE = 3
const DEBUG_PAD = 16

const args = process.argv.slice(2)
const debug = args.includes('--debug')
const only = args.filter((a) => !a.startsWith('--'))

/** Tight bounding box of non-transparent pixels, or null if fully transparent. */
function alphaBounds({ data, info }) {
    const { width, height, channels } = info
    let left = width
    let top = height
    let right = -1
    let bottom = -1

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (data[(y * width + x) * channels + 3] <= ALPHA_THRESHOLD) continue
            if (x < left) left = x
            if (x > right) right = x
            if (y < top) top = y
            if (y > bottom) bottom = y
        }
    }

    if (right < 0) return null
    return { left, top, width: right - left + 1, height: bottom - top + 1 }
}

function boundsOf(image, rect) {
    return image
        .clone()
        .extract(rect)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
        .then(alphaBounds)
}

async function normalize(name, anim, manifest) {
    const cellW = anim.cellWidth ?? manifest.cellWidth
    const cellH = anim.cellHeight ?? manifest.cellHeight
    const anchor = anim.anchor ?? 'ground'
    const hAlign = anim.hAlign ?? 'center'
    const kernel = anim.kernel ?? manifest.kernel ?? 'lanczos3'
    const { frameCount } = anim

    const srcPath = join(SPRITES, anim.src)
    const source = sharp(await readFile(srcPath))
    const { width, height } = await source.metadata()

    const srcCellW = Math.floor(width / frameCount)
    if (width % frameCount !== 0) {
        console.warn(
            `  ! ${width}px does not divide evenly into ${frameCount} frames ` +
                `(${width % frameCount}px remainder). Using ${srcCellW}px columns; ` +
                `the last frame may clip. Re-export the sheet at a multiple of ${frameCount}.`,
        )
    }

    // Trim every frame first — the union tells us how much room the animation
    // actually needs, which fixes one scale for all frames. Scaling each frame
    // to fill its own cell would erase the size variation that makes an idle
    // loop breathe.
    const frames = []
    for (let i = 0; i < frameCount; i++) {
        const rect = { left: i * srcCellW, top: 0, width: srcCellW, height }
        const box = await boundsOf(source, rect)
        if (!box) throw new Error(`${name}: frame ${i} is fully transparent`)
        // `left` is absolute (for extraction), `cellLeft` is relative to the
        // frame's own column — the union must be measured in cell space or it
        // spans the whole sheet.
        frames.push({ ...box, cellLeft: box.left, left: rect.left + box.left })
    }

    const union = {
        left: Math.min(...frames.map((f) => f.cellLeft)),
        top: Math.min(...frames.map((f) => f.top)),
    }
    union.width = Math.max(...frames.map((f) => f.cellLeft + f.width)) - union.left
    union.height = Math.max(...frames.map((f) => f.top + f.height)) - union.top

    const scale = Math.min(cellW / union.width, cellH / union.height)
    const unionX = Math.round((cellW - union.width * scale) / 2)
    const unionY = cellH - Math.round(union.height * scale)

    const layers = []
    for (const [i, f] of frames.entries()) {
        const w = Math.max(1, Math.round(f.width * scale))
        const h = Math.max(1, Math.round(f.height * scale))

        const buffer = await source
            .clone()
            .extract({ left: f.left, top: f.top, width: f.width, height: f.height })
            .resize(w, h, { kernel, fit: 'fill' })
            .png()
            .toBuffer()

        // ground: pin every frame's bottom edge to the same line, so squash and
        // stretch happens above the contact point instead of lifting the feet.
        // fixed: keep each frame's vertical offset, for jumps and hops.
        const top =
            anchor === 'ground' ? cellH - h : unionY + Math.round((f.top - union.top) * scale)
        const left =
            hAlign === 'center'
                ? Math.round((cellW - w) / 2)
                : unionX + Math.round((f.cellLeft - union.left) * scale)

        layers.push({ input: buffer, left: i * cellW + left, top })
        f.placed = { left, top, width: w, height: h }
    }

    const sheet = await sharp({
        create: {
            width: frameCount * cellW,
            height: cellH,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite(layers)
        .png()
        .toBuffer()

    const outDir = join(ROOT, manifest.outDir)
    await mkdir(outDir, { recursive: true })
    await writeFile(join(outDir, `${name}.png`), sheet)

    console.log(
        `  ${name}: ${width}x${height} -> ${frameCount * cellW}x${cellH} ` +
            `(${frameCount} x ${cellW}x${cellH}, anchor=${anchor}, scale=${scale.toFixed(3)})`,
    )

    // Verify against the output rather than the input: re-measure each frame in
    // the sheet we just wrote. A ground-anchored frame whose bottom isn't cellH
    // means the pass is wrong, not the art.
    const out = sharp(sheet)
    for (let i = 0; i < frameCount; i++) {
        const box = await boundsOf(out, { left: i * cellW, top: 0, width: cellW, height: cellH })
        frames[i].verified = box
        const baseline = box ? box.top + box.height : 0
        const flag = anchor === 'ground' && baseline !== cellH ? '  <-- off baseline' : ''
        console.log(
            `    frame ${i}: src ${frames[i].width}x${frames[i].height} ` +
                `-> ${box.width}x${box.height} at (${box.left},${box.top}) baseline ${baseline}${flag}`,
        )
    }

    if (debug) await writeDebug(name, sheet, frames, frameCount, cellW, cellH, anchor)
}

async function writeDebug(name, sheet, frames, frameCount, cellW, cellH, anchor) {
    const S = DEBUG_SCALE
    const P = DEBUG_PAD
    const w = frameCount * cellW * S
    const h = cellH * S

    const scaled = await sharp(sheet).resize(w, h, { kernel: 'nearest' }).png().toBuffer()

    const baseline = anchor === 'ground' ? cellH * S : null
    const parts = [`<rect x="0" y="0" width="${w + P * 2}" height="${h + P * 2}" fill="#1b1b20"/>`]
    for (let i = 0; i < frameCount; i++) {
        parts.push(
            `<rect x="${P + i * cellW * S}" y="${P}" width="${cellW * S}" height="${cellH * S}" ` +
                `fill="none" stroke="#3f3f4a" stroke-width="1"/>`,
        )
        const b = frames[i].verified
        if (b) {
            parts.push(
                `<rect x="${P + (i * cellW + b.left) * S}" y="${P + b.top * S}" ` +
                    `width="${b.width * S}" height="${b.height * S}" ` +
                    `fill="none" stroke="#f2b33d" stroke-width="1" stroke-dasharray="4 3"/>`,
            )
        }
    }
    if (baseline !== null) {
        parts.push(
            `<line x1="0" y1="${P + baseline}" x2="${w + P * 2}" y2="${P + baseline}" ` +
                `stroke="#4ad4a0" stroke-width="1"/>`,
        )
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w + P * 2}" height="${h + P * 2}">${parts.join('')}</svg>`
    const dir = join(SPRITES, 'debug')
    await mkdir(dir, { recursive: true })
    await sharp(Buffer.from(svg))
        .composite([{ input: scaled, left: P, top: P }])
        .png()
        .toFile(join(dir, `${name}.png`))

    console.log(`    debug -> sprites/debug/${name}.png`)
}

const manifest = JSON.parse(await readFile(join(SPRITES, 'manifest.json'), 'utf8'))
const names = Object.keys(manifest.animations).filter((n) => only.length === 0 || only.includes(n))

if (names.length === 0) {
    console.error(`No animations matched: ${only.join(', ')}`)
    process.exit(1)
}

console.log(`Normalizing ${names.length} animation(s)...`)
for (const name of names) {
    await normalize(name, manifest.animations[name], manifest)
}
console.log('Done.')
