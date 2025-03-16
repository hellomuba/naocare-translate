import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLanguage, targetLanguage } = await request.json()

    if (!text || !sourceLanguage || !targetLanguage) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get custom API key if provided
    const customApiKey = request.headers.get("X-Custom-OpenAI-Key")
    const apiKey = customApiKey || process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key is missing" }, { status: 400 })
    }

    // Get language names for better prompting
    const getLanguageName = (code: string) => {
      const languages: Record<string, string> = {
        en: "English",
        es: "Spanish",
        fr: "French",
        zh: "Chinese",
        ig: "Igbo",
        ha: "Hausa",
        yo: "Yoruba",
      }
      return languages[code] || code
    }

    const sourceLangName = getLanguageName(sourceLanguage)
    const targetLangName = getLanguageName(targetLanguage)

    // Use OpenAI API for translation
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a medical translator specializing in healthcare terminology. 
                     Translate the following text from ${sourceLangName} to ${targetLangName}. 
                     Maintain medical accuracy and use appropriate healthcare terminology.
                     Only respond with the translated text, nothing else.`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("OpenAI API error:", errorData)
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const translatedText = data.choices[0].message.content

    return NextResponse.json({ translatedText })
  } catch (error) {
    console.error("Translation error:", error)
    return NextResponse.json({ error: "Failed to translate text" }, { status: 500 })
  }
}

