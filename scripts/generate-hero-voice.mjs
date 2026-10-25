import fs from 'node:fs'
import { GoogleGenAI } from '@google/genai'

const transcript = `Les avis clients arrivent de partout : formulaires, emails, support, enquêtes et commentaires en ligne. Ils contiennent des signaux précieux, mais lorsqu’ils restent dispersés, il devient difficile de savoir quoi traiter en premier.

Qualio rassemble ces retours dans un même espace et les organise automatiquement. L’intelligence artificielle repère les thèmes qui reviennent, distingue les irritants des compliments et fait ressortir les problèmes qui méritent vraiment votre attention.

Vous obtenez alors une lecture claire de l’expérience client : les sujets prioritaires, leur évolution et les preuves qui les justifient. Chaque recommandation est reliée aux retours qui l’ont déclenchée, pour que l’équipe puisse comprendre le problème et agir avec confiance.

Depuis Qualio, vous pouvez transformer cette analyse en action concrète : valider une recommandation, l’assigner à la bonne personne et suivre sa progression. Les décisions ne restent plus dans un tableau ou dans une réunion ; elles deviennent des actions mesurables.

Au fil du temps, vous voyez ce qui s’améliore, ce qui se dégrade et l’impact réel des décisions prises. Qualio transforme enfin les avis clients en une direction claire pour toute votre équipe.`

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) throw new Error('GEMINI_API_KEY manquante')

const client = new GoogleGenAI({ apiKey })
const interaction = await client.interactions.create({
  model: 'gemini-3.8-flash-tts',
  input: [{
    type: 'user_input',
    content: [{
      type: 'text',
      text: transcript,
      annotations: [{
        type: 'speech_metadata',
        style: 'Voix française naturelle, chaleureuse et posée. Ton de démonstration SaaS premium, articulation claire, rythme régulier, avec de courtes pauses entre les paragraphes. Ne lis pas les consignes de style.',
      }],
    }],
  }],
  response_format: { type: 'audio', mime_type: 'audio/wav' },
  generation_config: { speech_config: [{ voice: 'Kore' }] },
})

const audio = interaction.output_audio?.data
if (!audio) throw new Error('Gemini n’a pas renvoyé de piste audio')
fs.writeFileSync('public/qualio-voiceover.wav', Buffer.from(audio, 'base64'))
console.log('Narration générée : public/qualio-voiceover.wav')
