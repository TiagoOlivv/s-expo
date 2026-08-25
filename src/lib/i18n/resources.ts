import enUS from '@/translations/en-us.json';
import ptBR from '@/translations/pt-br.json';

export const resources = {
  'en-US': {
    translation: enUS,
  },
  'pt-BR': {
    translation: ptBR,
  },
};

export type Language = keyof typeof resources;

export const DEFAULT_LANGUAGE: Language = 'en-US';
