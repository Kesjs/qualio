import fs from 'node:fs'
import { GoogleGenAI } from '@google/genai'

const transcript = `Vos clients vous disent déjà quoi améliorer. Koualio le lit pour vous.

Centralisez tous vos avis au même endroit. Koualio analyse chaque retour, repère ce qui revient, et vous dit quoi faire.

Pas de magie : chaque conseil cite de vrais avis.

Ajoutez vos retours de trois façons : fichier CSV, saisie manuelle, ou widget sur votre site.

Lancez votre synthèse, validez la priorité du moment, et Koualio suit l’effet réel de chaque décision.

Partagez la tâche à votre équipe en un clic : par e-mail, PDF, ou via un lien direct accessible sans même créer de compte.

Chaque chiffre se vérifie dans vos statistiques, et vous retrouvez tous les avis bruts filtrables par thème, sentiment ou source.

Importez un nouveau fichier en quelques secondes, envoyez vos idées produit et gérez votre espace en toute simplicité.

Vos clients vous parlent déjà. Rien n’est appliqué sans votre accord. Arrêtez de deviner, décidez avec vos clients. Essayez Koualio gratuitement.`

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
