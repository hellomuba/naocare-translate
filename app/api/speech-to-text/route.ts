import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const sourceLanguage = formData.get("sourceLanguage") as string

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Get custom API key if provided
    const customApiKey = request.headers.get("X-Custom-Deepgram-Key")
    const apiKey = customApiKey || process.env.DEEPGRAM_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Deepgram API key is missing" }, { status: 400 })
    }

    // Convert the audio file to an ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    // Map language codes to Deepgram language codes
    const languageMap: Record<string, string> = {
      en: "en-US",
      es: "es",
      fr: "fr",
      zh: "zh",
      ig: "en", // Fallback to English for languages not directly supported
      ha: "en", // Fallback to English for languages not directly supported
      yo: "en", // Fallback to English for languages not directly supported
    }

    // Use Deepgram API for speech-to-text
    const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "audio/wav",
      },
      body: audioBuffer,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Deepgram API error:", errorData)
      throw new Error(`Deepgram API error: ${response.statusText}`)
    }

    const data = await response.json()
    const text = data.results?.channels[0]?.alternatives[0]?.transcript || ""

    return NextResponse.json({ text })
  } catch (error) {
    console.error("Speech-to-text error:", error)
    return NextResponse.json({ error: "Failed to process speech" }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

