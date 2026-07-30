import { create } from 'zustand'

interface SettingsState {
  launchOnStartup: boolean
}

export const useSettingsStore = create<SettingsState>((set) => ({
  launchOnStartup: false
}))
