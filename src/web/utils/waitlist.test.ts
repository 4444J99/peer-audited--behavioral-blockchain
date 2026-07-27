import {
  WAITLIST_ATTRIBUTION_KEYS,
  collectAttribution,
  buildSignupBody,
} from './waitlist';

describe('collectAttribution', () => {
  it('extracts only the known attribution keys', () => {
    const params = new URLSearchParams(
      'source=do-not-text-tonight&intent=no-contact-urge&utm_source=emergency_asset&utm_campaign=do_not_text_your_ex_tonight&unrelated=drop-me',
    );
    const result = collectAttribution(params);

    expect(result).toEqual({
      source: 'do-not-text-tonight',
      intent: 'no-contact-urge',
      utm_source: 'emergency_asset',
      utm_campaign: 'do_not_text_your_ex_tonight',
    });
    expect(result).not.toHaveProperty('unrelated');
  });

  it('returns an empty object when no attribution is present', () => {
    expect(collectAttribution(new URLSearchParams(''))).toEqual({});
  });

  it('covers every documented attribution key', () => {
    const params = new URLSearchParams(
      WAITLIST_ATTRIBUTION_KEYS.map((k) => `${k}=v_${k}`).join('&'),
    );
    const result = collectAttribution(params);
    for (const key of WAITLIST_ATTRIBUTION_KEYS) {
      expect(result[key]).toBe(`v_${key}`);
    }
  });
});

describe('buildSignupBody', () => {
  it('trims fields and folds in attribution + referrer', () => {
    const body = buildSignupBody(
      { email: '  User@Example.com  ', name: '  Sam  ', goal: ' no-contact ' },
      { source: 'do-not-text-tonight', utm_source: 'emergency_asset' },
      'https://news.example.com/post',
    );

    expect(body).toEqual({
      email: 'User@Example.com',
      name: 'Sam',
      goal: 'no-contact',
      source: 'do-not-text-tonight',
      utm_source: 'emergency_asset',
      referrer: 'https://news.example.com/post',
    });
  });

  it('omits empty optional fields', () => {
    const body = buildSignupBody({ email: 'a@b.com', name: '', goal: '   ' }, {});
    expect(body).toEqual({ email: 'a@b.com' });
    expect(body).not.toHaveProperty('name');
    expect(body).not.toHaveProperty('goal');
    expect(body).not.toHaveProperty('referrer');
  });
});
