import { Plugin, PluginID } from '@/types/plugin';

export const getDomainAPI = () => {
  return 'http://localhost:8001';
}

export const getEndpointChat = () => {
  return `${getDomainAPI()}/api/chat`;
};

export const getEndpointAgent = () => {
  return `${getDomainAPI()}/api/agent`;
};

export const getEndpointUploadFile = () => {
  return `${getDomainAPI()}/api/upload`;
};

export const getEndpointListPage = () => {
  return `${getDomainAPI()}/api/page/list`;
};
