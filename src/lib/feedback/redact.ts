/**
 * Masque les coordonnées personnelles dans le texte d'un avis avant de l'afficher sur une page publique
 * (adresses e-mail, numéros de téléphone, liens). Le texte reste lisible, mais plus identifiable.
 */
export function redactPersonalInfo(text: string): string {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[e-mail masqué]')
    .replace(/https?:\/\/\S+/gi, '[lien masqué]')
    .replace(/(?<!\d)(?:\+|00)?\d[\d .\-()]{7,}\d(?!\d)/g, '[numéro masqué]')
}
