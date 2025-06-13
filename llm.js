
import {GoogleGenAI, Modality} from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
})


const urlToGenerativePart = async imageUrl => {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch image: ${response.status} ${response.statusText}`
    )
  }

  const blob = await response.blob()
  const mimeType = response.headers.get('Content-Type') || blob.type

  if (!mimeType) {
    throw new Error('Could not determine MIME type for the image.')
  }

  const base64EncodedDataPromise = new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1])
      } else {
        reject(new Error('Failed to read image data as base64 string.'))
      }
    }
    reader.onerror = error => reject(error)
    reader.readAsDataURL(blob)
  })

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType
    }
  }
}

export const queryLlm = async ({prompt, image: imageUrl}) => {
  const contentParts = [{text: prompt}]

  if (imageUrl && typeof imageUrl === 'string') {
    try {
      const imagePart = await urlToGenerativePart(imageUrl)
      contentParts.push(imagePart)
    } catch (error) {
      console.error(`Error processing image URL "${imageUrl}":`, error)

    }
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-04-17',
    contents: contentParts,
    config:{
      thinkingConfig: {
        thinkingBudget: 0,
      },
    }
  })
  return response.text
}
