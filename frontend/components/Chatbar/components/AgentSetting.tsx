import { IconFileExport, IconSettings } from '@tabler/icons-react';
import { useContext, useState } from 'react';

import { useTranslation } from 'next-i18next';


import { SettingAgent } from '@/components/Settings/SettingAgent';

import { SidebarButton } from '../../Sidebar/SidebarButton';

import { Prompt } from '@/types/prompt';

export const AgentSetting = () => {
  const { t } = useTranslation('sidebar');
  const [isSettingDialogOpen, setIsSettingDialog] = useState<boolean>(false);

  const getActivePrompt = (): Prompt | null => {
    const promptCached = localStorage.getItem('prompts');
    let prompts: Prompt[] = [];
    if (promptCached) {
      prompts = JSON.parse(promptCached) as Prompt[];
    }

    const active = prompts.find(item => item.active);

    if (active) {
      return active;
    }

    return null;
  }

  const activePrompt = getActivePrompt();

  return (
    activePrompt?.inputType !== "default" ? (<div className="flex flex-col items-center space-y-1 border-t border-white/20 pt-1 text-sm">
      
      <SidebarButton
        text={t('Agent Settings')}
        icon={<IconSettings size={18} />}
        onClick={() => setIsSettingDialog(true)}
      />

      <SettingAgent
        open={isSettingDialogOpen}
        onClose={() => {
          setIsSettingDialog(false);
        }}
      />
    </div>) : null
  );
};
