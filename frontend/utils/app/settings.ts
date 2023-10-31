import { Settings } from '@/types/settings';

const STORAGE_KEY = 'settings';
const STORAGE_KEY_AGENT = 'agent_settings';

export const getSettings = (): Settings => {
  let settings: Settings = {
    theme: 'dark',
  };
  const settingsJson = localStorage.getItem(STORAGE_KEY);
  if (settingsJson) {
    try {
      let savedSettings = JSON.parse(settingsJson) as Settings;
      settings = Object.assign(settings, savedSettings);
    } catch (e) {
      console.error(e);
    }
  }
  return settings;
};

export const saveSettings = (settings: Settings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

export const getAgentSetting = (): any => {
  const settingsJson = localStorage.getItem(STORAGE_KEY_AGENT);
  let settings;
  if (settingsJson) {
    try {
      settings = JSON.parse(settingsJson) as Settings;
    } catch (e) {
      console.error(e);
    }
  }
  return settings;
}

export const saveAgentSetting = (settings: any) => {
  localStorage.setItem(STORAGE_KEY_AGENT, JSON.stringify(settings));
};
