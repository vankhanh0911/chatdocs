import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { Prompt } from '@/types/prompt';

import { useFetch } from '@/hooks/useFetch';

import { IconFileTypePdf, IconSettings } from '@tabler/icons-react';

import { getEndpointAgent, getEndpointUploadFile } from '@/utils/app/api';

interface Props {
  prompt: Prompt;
  onClose: () => void;
  onUpdatePrompt: (prompt: Prompt) => void;
  mode: "create" | "update",
}

export const PromptModal: FC<Props> = ({ prompt, onClose, onUpdatePrompt }) => {
  const { t } = useTranslation('promptbar');
  const [name, setName] = useState(prompt ? prompt.name : '');
  const [description, setDescription] = useState(prompt ? prompt.description : '');
  const [inputType, setInputType] = useState(prompt? prompt.inputType : 'upload'); // Tracks the selected input type
  const [file, setFile] = useState(prompt? prompt.file : ''); // Tracks the selected input type
  const [url, setUrl] = useState(prompt? prompt.url : ''); // Tracks the selected input type
  const [selector, setSelector] = useState(prompt? prompt.selector : ''); // Tracks the selected input type

  const [errors, setErrors] = useState({});

  const fetchService = useFetch();

  const handleInputChange = (event: any) => {
    setInputType(event.target.value);
  };

  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleEnter = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      onUpdatePrompt({ ...prompt, name, description });
      onClose();
    }
  };

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

  const handleDrop = (event: any) => {
    event.preventDefault();

    const files = event.dataTransfer.files;
    handleFiles(files);
  };

  const handleFiles = async (files: any) => {
    // Handle the files here (e.g., upload or display them)
    const fileUpload = files[0];

    if (!fileUpload) {
      throw new Error("File empty")
    }

    const endpoint = getEndpointUploadFile();
    console.log("endpoint", endpoint);
    let formData = new FormData()
    formData.append('file', files[0]);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.data && data.data.fileUrl) {
      const fileUrl = data.data.fileUrl

      setFile(fileUrl);
    }
    
  };

  const handleFileSelect = (event: any) => {
    event.preventDefault();

    const files = event.target.files;
    handleFiles(files);
  };

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSave = async () => {
    let updatedPrompt = {
      ...prompt,
      name,
      description,
      inputType: inputType,
      url,
      file,
      selector
    };

    const endpoint = getEndpointAgent();
    
    const body = JSON.stringify(updatedPrompt);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await response.json();

    const {agentId} = data.data as any;

    if (agentId && agentId != "") {
      updatedPrompt = {
        ...updatedPrompt, 
        id: agentId
      }
      onUpdatePrompt(updatedPrompt);
      onClose();
    } else {
      console.log('error');
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onKeyDown={handleEnter}
    >
      <div className="fixed inset-0 z-10 overflow-hidden">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          />

          <div
            ref={modalRef}
            className="dark:border-netural-400 inline-block max-h-[400px] transform overflow-y-auto rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
            role="dialog"
          >
            <div className="text-sm font-bold text-black dark:text-neutral-200">
              {t('Name')}
            </div>
            <input
              ref={nameInputRef}
              className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
              placeholder={t('A name for your Agent.') || ''}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="mt-6 text-sm font-bold text-black dark:text-neutral-200">
              {t('Description')}
            </div>
            <textarea
              className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
              style={{ resize: 'none' }}
              placeholder={t('A description for your Agent.') || ''}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />

            <div className="mt-6 text-sm font-bold text-black dark:text-neutral-200">
              {t('Agent Type')}
            </div>
            <select
                value={inputType}
                onChange={handleInputChange}
                className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
              >
            <option value="upload">Upload File</option>
            <option value="link">Input Link</option>
          </select>


          {inputType === 'upload' && (
            <div className="flex justify-center mt-16">
              {
                file != "" ? (
                  <div style={{display: 'flex', alignItems: 'center'}}>
                    <IconFileTypePdf size={48} />
                    {file}
                  </div>
                ) : (
                  <div
                    className="w-64 border border-dashed border-gray-300 p-6"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="flex flex-col items-center">
                      <label htmlFor="fileInput" className="cursor-pointer">
                        <input
                          type="file"
                          id="fileInput"
                          className="hidden"
                          accept=".pdf"
                          onChange={handleFileSelect}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" style={{float: 'left'}} width="50" height="50" id="share"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M1 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M13 5 9 1 5 5M9 1v13"></path></g></svg>
                        <span className="ml-2">
                          Drag and drop your files here or click to upload
                        </span>
                      </label>
                    </div>
                  </div>
                )
              }
            </div>
          )}


            {inputType === 'link' && (
              <><div className="mt-6 text-sm font-bold text-black dark:text-neutral-200">
                {t('Link Crawler')}
              </div><input
                  className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
                  placeholder={'https://abc.com'}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)} />
                  
                  <div className="mt-6 text-sm font-bold text-black dark:text-neutral-200">
                {t('Selector')}
              </div><input
                  className="mt-2 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
                  placeholder={'body > main'}
                  value={selector}
                  onChange={(e) => setSelector(e.target.value)} /></>
          )}
  

            <button
              type="button"
              className="w-full px-4 py-2 mt-6 border rounded-lg shadow border-neutral-500 text-neutral-900 hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
              onClick={handleSave}
            >
              {t('Save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
