import { nextLanguage, nextTheme } from './toggle-preferences';

describe('nextTheme', () => {
  it('switches a dark screen to light', () => {
    expect(nextTheme('dark')).toBe('light');
  });

  it('switches a light screen to dark', () => {
    expect(nextTheme('light')).toBe('dark');
  });
});

describe('nextLanguage', () => {
  it('toggles en-US to pt-BR', () => {
    expect(nextLanguage('en-US')).toBe('pt-BR');
  });

  it('toggles pt-BR to en-US', () => {
    expect(nextLanguage('pt-BR')).toBe('en-US');
  });

  it('falls back to pt-BR when no language has been selected yet', () => {
    expect(nextLanguage(undefined)).toBe('pt-BR');
  });
});
