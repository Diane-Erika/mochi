import { ElectronAPI } from '@electron-toolkit/preload'

export interface PetAPI {
    moveBy: (dx: number) => Promise<{ x: number; atLeft: boolean; atRight: boolean }>
}

declare global {
    interface Window {
        electron: ElectronAPI
        api: PetAPI
    }
}
