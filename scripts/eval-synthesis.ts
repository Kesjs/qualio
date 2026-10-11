import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { generateFeedbackSynthesis } from '../src/lib/feedback/ai'

type Fixture = { name: string; expectedThemes: string[]; feedback: string[] }

async function main() {
  const names = ['saas', 'ecommerce', 'mobile']
  const results: Array<Record<string, string | number | boolean>> = []
  for (const name of names) {
    const fixture = JSON.parse(await readFile(resolve(process.cwd(), `src/lib/feedback/__fixtures__/${name}.json`), 'utf8')) as Fixture
    const feedback = fixture.feedback.map((content, index) => ({ id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`, content, created_at: new Date(Date.now() - index * 3600000).toISOString() }))
    const synthesis = await generateFeedbackSynthesis(feedback)
    const validIds = new Set(feedback.map((item) => item.id))
    const idsValid = Boolean(synthesis) && synthesis.themes.every((theme) => theme.feedback_ids.every((id) => validIds.has(id))) && synthesis.recommendations.every((recommendation) => recommendation.feedback_ids.every((id) => validIds.has(id)))
    const recsSourced = Boolean(synthesis) && synthesis.recommendations.every((recommendation) => recommendation.feedback_ids.length >= 2)
    const themesFound = Boolean(synthesis) && fixture.expectedThemes.filter((expected) => synthesis.themes.some((theme) => theme.name.toLocaleLowerCase().includes(expected.toLocaleLowerCase()))).length >= Math.ceil(fixture.expectedThemes.length / 2)
    const countsValid = Boolean(synthesis) && synthesis.themes.every((theme) => theme.count === new Set(theme.feedback_ids).size)
    results.push({ jeu: fixture.name, json: Boolean(synthesis), ids: idsValid, recommandations: recsSourced, themes: themesFound, chiffres: countsValid })
  }
  console.table(results)
  if (results.some((result) => Object.values(result).some((value) => value === false))) process.exitCode = 1
}

void main()
