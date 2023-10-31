import { FC, useContext, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { DEFAULT_TEMPERATURE } from '@/utils/app/const';

import HomeContext from '@/pages/api/home/home.context';

interface Props {
  label: string;
  defaultValue: string,
  description: string,
  keyStorage: string,
  min: number,
  max: number,
  onchangeValue: (value: string) => void;
}

export const ValueSlayder: FC<Props> = ({
  label,
  keyStorage,
  defaultValue,
  description,
  onchangeValue,
  min,
  max
}) => {

  const score = localStorage.getItem(keyStorage);

  const [value, setValue] = useState(
    score ?? defaultValue,
  );
  const { t } = useTranslation('chat');
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setValue(newValue);
    onchangeValue(newValue);
  };

  return (
    <div className="flex flex-col mt-2">
      <label className="mb-2 text-left text-neutral-700 font-bold dark:text-neutral-200">
        {label}
      </label>
      <span className="text-[12px] text-black dark:text-white text-sm">
        {t(
          description,
        )}
      </span>
      <span className="mt-2 mb-1 text-center text-neutral-900 dark:text-neutral-100">
        {value}
      </span>
      <input
        className="cursor-pointer"
        type="range"
        min={min}
        max={max}
        step={0.1}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};
