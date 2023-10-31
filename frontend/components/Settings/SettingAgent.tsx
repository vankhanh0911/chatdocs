import { FC, useContext, useEffect, useReducer, useRef, useState } from 'react';
import Select from 'react-select';

import { useTranslation } from 'next-i18next';
import useDeepCompareEffect from 'use-deep-compare-effect'


import { useCreateReducer } from '@/hooks/useCreateReducer';

import { getAgentSetting, saveAgentSetting } from '@/utils/app/settings';

import { Settings } from '@/types/settings';
import { Prompt } from '@/types/prompt';

import HomeContext from '@/pages/api/home/home.context';

import { getEndpointListPage } from '@/utils/app/api';


interface Props {
  open: boolean;
  onClose: () => void;
}

export const SettingAgent: FC<Props> = ({ open, onClose }) => {
  const { t } = useTranslation('settings');

  const { dispatch: homeDispatch } = useContext(HomeContext);
  const modalRef = useRef<HTMLDivElement>(null);

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

  const {
    state: {
      selectedConversation,
      prompts
    },
    handleUpdateConversation,
  } = useContext(HomeContext);

  const handleUpdateSettingVariable = (params: {key: string, value: string}) => {
    localStorage.setItem(params.key, params.value.toString());
  }

  const activePrompt = getActivePrompt();

  const currentsetting = getAgentSetting();
  let selectOption = 'allPage';
  let selectDocument = [];
  let knowledge = false;
  if (activePrompt && currentsetting && currentsetting[activePrompt.id]) {
    selectOption = currentsetting[activePrompt.id].selectedOption
    selectDocument = currentsetting[activePrompt.id].selectedDocuments
    knowledge = currentsetting[activePrompt.id].knowledgeType
  }  

  const [selectedOption, setSelectedOption] = useState(selectOption);
  const [selectedDocuments, setSelectedDocuments] = useState<{ value: string; label: string }[]>(selectDocument);
  const [pages, setPages] = useState([]);
  const [knowledgeType, setKnowledgeType] = useState(knowledge);
  const [isDisabled, setIsDisabled] = useState(selectDocument.length >= 3);

  const handleDocumentSelect = (selectedValues: any) => {
    if (selectedValues.length > 3) {
      setSelectedDocuments(selectedValues.slice(0,3));
    } else {
      setSelectedDocuments(selectedValues);
    }
  };

  const updateDisabled = () => {
    setIsDisabled(false);


    setIsDisabled(true);
  }

  const handleOptionChange = (option: string) => {
    setSelectedOption(option);
  };

  useDeepCompareEffect(() => {
    const activePrompt = getActivePrompt();

    if (activePrompt) {
      // call api get list page
     
      getListPage(activePrompt);
    }

    const currentsetting = getAgentSetting();
    let selectOption = 'allPage';
    let selectDocument = [];
    if (activePrompt && currentsetting && currentsetting[activePrompt.id]) {
      selectOption = currentsetting[activePrompt.id].selectedOption
      selectDocument = currentsetting[activePrompt.id].selectedDocuments

      setSelectedDocuments(selectDocument);
      setSelectedOption(selectOption);
    } 
  }, [prompts]);

  const getListPage = async (activePrompt: Prompt) => {
    if (activePrompt.inputType !== 'default') {
      const endpoint = getEndpointListPage();

      const body = JSON.stringify({
        agent_id: activePrompt.id
      });

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        });

        const data = await response.json();

        if (data.data && data.data.pages) {
          setPages(data.data.pages)
        }
    }
    
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
    const activePrompt = getActivePrompt();

    if (activePrompt) {
      const currentsetting = getAgentSetting();
      
      saveAgentSetting({
        ...currentsetting,
        [activePrompt.id]: {
          selectedOption: selectedOption,
          selectedDocuments: selectedDocuments,
          knowledgeType: knowledgeType
        }
      });
      
    }
  };

  // Render nothing if the dialog is not open.
  if (!open) {
    return <></>;
  }

  const customStyles = {
    // control: (provided, state) => ({
    //   ...provided,
    //   backgroundColor: 'white',
    //   border: '1px solid #ccc',
    //   borderRadius: '4px',
    // }),
    option: (provided, state) => ({
      ...provided,
      maxWidth: '100%',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }),
    menuList: () => ({
      maxHeight: '150px',
      overflow: 'auto'
    })
  };

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
            className="dark:border-netural-400 inline-flex flex-col max-h-[800px] h-[380px] transform overflow-y-auto rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[800px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
            role="dialog"
          >
            <div className="text-lg pb-4 font-bold text-black dark:text-neutral-200">
              {t('Agent Settings')}
            </div>

            <div className="flex flex-col mt-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  id="knowledge_type"
                  name="option"
                  value="knowledge_type"
                  checked={knowledgeType === true}
                  onChange={() => setKnowledgeType(!knowledgeType)}
                  className="text-blue-500"
                />
                <span className="ml-2">External Knowledge</span>
              </label>
            </div>

            <div className="flex flex-col mt-2">
              <label className="mb-2 text-left text-neutral-700 font-bold dark:text-neutral-200">
                {'Lookup Type: '}
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  id="allPage"
                  name="option"
                  value="allPage"
                  checked={selectedOption === 'allPage'}
                  onChange={() => handleOptionChange('allPage')}
                  className="text-blue-500"
                />
                <span className="ml-2">All page</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  id="selectDocument"
                  name="option"
                  value="selectDocument"
                  checked={selectedOption === 'selectDocument'}
                  onChange={() => handleOptionChange('selectDocument')}
                  className="text-blue-500"
                />
                <span className="ml-2">Select document</span>
              </label>
            </div>

            {selectedOption === 'selectDocument' ? (<div className="flex flex-col mt-2">
              <label className="mb-2 text-left text-neutral-700 font-bold dark:text-neutral-200">
                {'Choose Documents (Max 3 docs)'}
              </label>

              <Select
                value={selectedDocuments}
                isMulti
                name="documents"
                options={pages.map((document) => ({
                  value: document.id,
                  label: document.link,
                }))}
                onFocus={updateDisabled} 
                onChange={handleDocumentSelect}
                className="w-full text-neutral-700 font-bold dark:text-neutral-900"
                classNamePrefix="select"
                isDisabled={selectedDocuments.length > 3}
                styles={customStyles}
              />

            </div> ) : null }

            <button
              type="button"
              className="w-full px-4 py-2 mt-auto border rounded-lg shadow border-neutral-500 text-neutral-900 hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
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
