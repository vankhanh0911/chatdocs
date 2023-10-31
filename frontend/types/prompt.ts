import { OpenAIModel } from './openai';

export interface Prompt {
  id: string;
  name: string;
  description: string;
  model: OpenAIModel | null;
  folderId: string | null;
  inputType: string;
  url: string;
  selector: string;
  file: string;
  active: true | false
}
