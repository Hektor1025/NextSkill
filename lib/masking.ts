export function maskEmail(email: string | null | undefined) {
  if (!email) return "—";

  const [local, domain] = email.split("@");
  if (!local || !domain) return email;

  if (local.length <= 2) {
    return `${local[0] ?? "*"}*@${domain}`;
  }

  return `${local.slice(0, 2)}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

export function maskPhone(phone: string | null | undefined) {
  if (!phone) return "—";

  const digits = phone.replace(/\s+/g, "");
  if (digits.length <= 4) return "*".repeat(digits.length);

  return `${digits.slice(0, 3)}***${digits.slice(-2)}`;
}

export function maskNip(nip: string | null | undefined) {
  if (!nip) return "—";

  const clean = nip.replace(/\D/g, "");
  if (clean.length < 4) return "*".repeat(clean.length);

  return `${clean.slice(0, 3)}******${clean.slice(-1)}`;
}