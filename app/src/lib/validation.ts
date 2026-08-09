/**
 * Regras de validação compartilhadas entre cadastro, edição de perfil e troca
 * de senha. Funções puras — o backend em Go precisa aplicar as mesmas regras,
 * já que o cliente é só a primeira barreira.
 */

/** Simples o bastante para não rejeitar endereços válidos incomuns. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export const PASSWORD_MIN_LENGTH = 8;

export type PasswordRule = {
  label: string;
  ok: boolean;
};

/** Checklist mostrado embaixo do campo de senha no cadastro e na troca de senha. */
export function passwordRules(password: string): PasswordRule[] {
  return [
    { label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`, ok: password.length >= PASSWORD_MIN_LENGTH },
    // Sem `\p{L}`: o Hermes não garante suporte a property escapes.
    { label: 'Uma letra', ok: /[a-zA-ZÀ-ÿ]/.test(password) },
    { label: 'Um número', ok: /\d/.test(password) },
  ];
}

export function isValidPassword(password: string): boolean {
  return passwordRules(password).every((rule) => rule.ok);
}

/** `Ana Ribeiro` → `A`; usado para o avatar enquanto não há foto. */
export function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}
