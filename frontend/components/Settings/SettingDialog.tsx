import { FC, useContext, useEffect, useReducer, useRef } from 'react';

import { useTranslation } from 'next-i18next';

import { useCreateReducer } from '@/hooks/useCreateReducer';

import { getSettings, saveSettings } from '@/utils/app/settings';

import { Settings } from '@/types/settings';

import HomeContext from '@/pages/api/home/home.context';
import { ValueSlayder } from './ValueSlayder';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const SettingDialog: FC<Props> = ({ open, onClose }) => {
  const { t } = useTranslation('settings');
  const settings: Settings = getSettings();
  const { state, dispatch } = useCreateReducer<Settings>({
    initialState: settings,
  });
  const { dispatch: homeDispatch } = useContext(HomeContext);
  const modalRef = useRef<HTMLDivElement>(null);

  const {
    state: {
      selectedConversation,
    },
    handleUpdateConversation,
  } = useContext(HomeContext);

  const handleUpdateSettingVariable = (params: {key: string, value: string}) => {
    localStorage.setItem(params.key, params.value.toString());
  }

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        window.addEventListener('mouseup', handleMouseUp);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      window.removeEventListener('mouseup', handleMouseUp);
      onClose();
    };

    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onClose]);

  const handleSave = () => {
    homeDispatch({ field: 'lightMode', value: state.theme });
    saveSettings(state);
  };

  // Render nothing if the dialog is not open.
  if (!open) {
    return <></>;
  }

  // Render the dialog.
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="fixed inset-0 z-10 overflow-hidden">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          />

          <div
            ref={modalRef}
            className="dark:border-netural-400 inline-block max-h-[400px] transform overflow-y-auto rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[700px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
            role="dialog"
          >
            <div className="text-lg pb-4 font-bold text-black dark:text-neutral-200">
              {t('Settings')}
            </div>

            <div className="text-sm font-bold mb-2 text-black dark:text-neutral-200">
              {t('Theme')}
            </div>

            <select
              className="w-full cursor-pointer bg-transparent p-2 text-neutral-700 dark:text-neutral-200"
              value={state.theme}
              onChange={(event) =>
                dispatch({ field: 'theme', value: event.target.value })
              }
            >
              <option value="dark">{t('Dark mode')}</option>
              <option value="light">{t('Light mode')}</option>
            </select>

            <hr className="mt-3"></hr>

            <ValueSlayder
              label={t('Randomness')}
              defaultValue='1'
              min={0}
              max={1}
              keyStorage="temperature"
              description="The larger the value, the more random the reply"
              onchangeValue={(value) =>
                handleUpdateSettingVariable({
                  key: 'temperature',
                  value: value,
                })
              }
            />

            <ValueSlayder
              label={t('Nucleus Sampling')}
              defaultValue='1'
              min={0}
              max={1}
              keyStorage="top_p"
              description="Similar to randomness, but do not change together with randomness"
              onchangeValue={(value) =>
                handleUpdateSettingVariable({
                  key: 'top_p',
                  value: value,
                })
              }
            />

            <ValueSlayder
              label={t('Topic Freshness')}
              defaultValue='0'
              min={-2}
              max={2}
              keyStorage="presencePenalty"
              description="The larger the value, the more likely it is to expand to new topics"
              onchangeValue={(value) =>
                handleUpdateSettingVariable({
                  key: 'presencePenalty',
                  value: value,
                })
              }
            />

            <ValueSlayder
              label={t('Frequency Penalty')}
              defaultValue='0'
              min={-2}
              max={2}
              keyStorage="frequencyPenalty"
              description="The larger the value, the more likely it is to reduce repeated words"
              onchangeValue={(value) =>
                handleUpdateSettingVariable({
                  key: 'frequencyPenalty',
                  value: value,
                })
              }
            />

            <button
              type="button"
              className="w-full px-4 py-2 mt-6 border rounded-lg shadow border-neutral-500 text-neutral-900 hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
              onClick={() => {
                handleSave();
                onClose();
              }}
            >
              {t('Save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
