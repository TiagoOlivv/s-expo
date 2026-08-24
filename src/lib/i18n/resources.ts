import en from '@/translations/en.json';
import ptBR from '@/translations/pt-br.json';

export const resources = {
  'en': {
    translation: en,
  },
  'pt-BR': {
    translation: ptBR,
  },
};

export type Language = keyof typeof resources;
