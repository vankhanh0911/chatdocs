import { FC, useEffect, useRef, useContext } from 'react';

import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';

import { Plugin, PluginList } from '@/types/plugin';
import { PromptList } from './PromptList';

interface Props {
  plugin: Plugin | null;
  onPluginChange: (plugin: any) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLSelectElement>) => void;
}

export const PluginSelect: FC<Props> = ({
  plugin,
  onPluginChange,
  onKeyDown,
}) => {
  const { t } = useTranslation('chat');

  const {
    state: { prompts },

    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const selectRef = useRef<HTMLSelectElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    const selectElement = selectRef.current;
    const optionCount = selectElement?.options.length || 0;

    if (e.key === '/' && e.metaKey) {
      e.preventDefault();
      if (selectElement) {
        selectElement.selectedIndex =
          (selectElement.selectedIndex + 1) % optionCount;
        selectElement.dispatchEvent(new Event('change'));
      }
    } else if (e.key === '/' && e.shiftKey && e.metaKey) {
      e.preventDefault();
      if (selectElement) {
        selectElement.selectedIndex =
          (selectElement.selectedIndex - 1 + optionCount) % optionCount;
        selectElement.dispatchEvent(new Event('change'));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectElement) {
        selectElement.dispatchEvent(new Event('change'));
      }

      onPluginChange(
        prompts.find(
          (propmt) => propmt.name === selectElement?.selectedOptions[0].innerText,
        ) as any,
      );

    } else {
      onKeyDown(e);
    }
  };

  useEffect(() => {
    if (selectRef.current) {
      selectRef.current.focus();
    }
  }, []);

  return (
    <div className="flex flex-col">
      <div className="mb-1 w-full rounded border border-neutral-200 bg-transparent pr-2 text-neutral-900 dark:border-neutral-600 dark:text-white">
        <select
          ref={selectRef}
          className="w-full cursor-pointer bg-transparent p-2"
          placeholder={t('Select a plugin') || ''}
          value={plugin?.id || ''}
          onChange={(e) => {
            onPluginChange(
              prompts.find(
                (propmt) => propmt.id === e.target.value,
              ) as any,
            );
          }}
          onKeyDown={(e) => {
            handleKeyDown(e);
          }}
        >
          {prompts.map((prompt) => (
            <option
              key={prompt.id}
              value={prompt.id}
              className="dark:bg-[#343541] dark:text-white"
            >
              {prompt.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
