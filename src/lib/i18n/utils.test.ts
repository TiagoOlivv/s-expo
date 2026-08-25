import { changeLanguage, translate } from './index';

describe('translate', () => {
  afterAll(() => {
    changeLanguage('en-US');
  });

  it('returns strings for the language that is currently selected', () => {
    changeLanguage('en-US');
    const english = translate('home.description');

    changeLanguage('pt-BR');
    const portuguese = translate('home.description');

    expect(english).not.toBe('');
    expect(portuguese).not.toBe(english);
  });
});
