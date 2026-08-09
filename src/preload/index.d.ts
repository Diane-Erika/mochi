import { ElectronAPI } from '@electron-toolkit/preload'

export interface PetAPI {
    moveBy: (dx: number) => Promise<{ x: number; atLeft: boolean; atRight: boolean }>
    moveByY: (dy: number) => Promise<{ y: number; atTop: boolean; atBottom: boolean }>
}

declare global {
    interface Window {
        electron: ElectronAPI
        api: PetAPI
    }
}
