import {
  PASSWORD_MIN_LENGTH,
  initialOf,
  isValidEmail,
  isValidPassword,
  passwordRules,
} from '@/lib/validation';

describe('isValidEmail', () => {
  it.each([
    'ana@email.com',
    'ana.ribeiro@email.com.br',
    'ana+cartao@email.com',
    'a@b.co',
    'nome_com_underscore@sub.dominio.org',
  ])('aceita %p', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    '',
    'ana',
    'ana@',
    '@email.com',
    'ana@email',
    'ana@email.c',
    'ana @email.com',
    'ana@ema il.com',
    'ana@@email.com',
  ])('rejeita %p', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });

  it('ignora espaços em volta', () => {
    expect(isValidEmail('  ana@email.com  ')).toBe(true);
  });
});

describe('passwordRules', () => {
  it('devolve as três regras do checklist', () => {
    expect(passwordRules('').map((rule) => rule.label)).toEqual([
      `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
      'Uma letra',
      'Um número',
    ]);
  });

  it('senha vazia reprova em tudo', () => {
    expect(passwordRules('').map((rule) => rule.ok)).toEqual([false, false, false]);
  });

  it('marca só o tamanho quando faltam letra e número', () => {
    expect(passwordRules('--------').map((rule) => rule.ok)).toEqual([true, false, false]);
  });

  it('marca só a letra quando a senha é curta', () => {
    expect(passwordRules('abc').map((rule) => rule.ok)).toEqual([false, true, false]);
  });

  it('aceita letras acentuadas como letra', () => {
    expect(passwordRules('içá').map((rule) => rule.ok)[1]).toBe(true);
  });

  it('senha completa aprova em tudo', () => {
    expect(passwordRules('senha1234').map((rule) => rule.ok)).toEqual([true, true, true]);
  });
});

describe('isValidPassword', () => {
  it.each([['senha123'], ['Ab1cdefg'], ['12345678a']])('aceita %p', (password) => {
    expect(isValidPassword(password)).toBe(true);
  });

  it.each([
    ['', 'vazia'],
    ['senha', 'curta demais'],
    ['12345678', 'sem letra'],
    ['abcdefgh', 'sem número'],
    ['abc123', 'menos de 8 caracteres'],
  ])('rejeita %p (%s)', (password) => {
    expect(isValidPassword(password)).toBe(false);
  });

  it('aceita exatamente no limite de caracteres', () => {
    expect('senha12a'.length).toBe(PASSWORD_MIN_LENGTH);
    expect(isValidPassword('senha12a')).toBe(true);
  });
});

describe('initialOf', () => {
  it.each([
    ['Ana Ribeiro', 'A'],
    ['marcelo', 'M'],
    ['  joana  ', 'J'],
    ['ángela', 'Á'],
  ])('%p vira %p', (name, expected) => {
    expect(initialOf(name)).toBe(expected);
  });

  it('devolve ? para nome vazio ou só espaços', () => {
    expect(initialOf('')).toBe('?');
    expect(initialOf('   ')).toBe('?');
  });
});
