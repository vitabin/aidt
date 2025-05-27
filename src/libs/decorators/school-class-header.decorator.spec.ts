describe('Regex for extracting SingleAlphabet-number-number', () => {
  const regex = /\b[A-Z]-\d{2}-\d{2}\b/g;

  it('should match valid formats', () => {
    const testString = 'Some text A-12-34 more text B-56-78 and some C-90-12';
    const matches = testString.match(regex);

    expect(matches).toEqual(['A-12-34', 'B-56-78', 'C-90-12']);
  });

  it('should not match invalid formats', () => {
    const testString = 'Invalid text A12-34 B-567-89 C-90-123';
    const matches = testString.match(regex);

    expect(matches).toBeNull();
  });

  it('should match single valid format in a complex string', () => {
    const testString = 'This string contains only one valid format X-99-88 among others';
    const matches = testString.match(regex);

    expect(matches).toEqual(['X-99-88']);
  });

  it('should return null if no matches are found', () => {
    const testString = 'There are no valid formats here';
    const matches = testString.match(regex);

    expect(matches).toBeNull();
  });

  it('should match multiple valid formats separated by invalid ones', () => {
    const testString = 'Valid A-11-22 invalid B-222-33 and valid C-44-55';
    const matches = testString.match(regex);

    expect(matches).toEqual(['A-11-22', 'C-44-55']);
  });
});
