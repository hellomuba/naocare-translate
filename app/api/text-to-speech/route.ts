import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text, language } = await request.json()

    if (!text || !language) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get custom API key if provided
    const customApiKey = request.headers.get("X-Custom-ElevenLabs-Key")
    const apiKey = customApiKey || process.env.ELEVENLABS_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "ElevenLabs API key is missing" }, { status: 400 })
    }

    // Map language codes to ElevenLabs voice IDs
    // These are example voice IDs - you should replace with actual voice IDs from your ElevenLabs account
    const voiceMap: Record<string, string> = {
      en: "21m00Tcm4TlvDq8ikWAM", // Rachel - English
      es: "AZnzlk1XvdvUeBnXmlld", // Antonio - Spanish
      fr: "MF3mGyEYCl7XYWbV9V6O", // Nicole - French
      zh: "TxGEqnHWrfWFTfGW9XjX", // Xiaoxiao - Chinese
      ig: "21m00Tcm4TlvDq8ikWAM", // Fallback to English
      ha: "21m00Tcm4TlvDq8ikWAM", // Fallback to English
      yo: "21m00Tcm4TlvDq8ikWAM", // Fallback to English
    }

    const voiceId = voiceMap[language] || voiceMap.en

    // Use ElevenLabs API for text-to-speech
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("ElevenLabs API error:", errorText)
      throw new Error(`ElevenLabs API error: ${response.statusText}`)
    }

    // Return the audio directly
    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    })
  } catch (error) {
    console.error("Text-to-speech error:", error)
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 })
  }
}

