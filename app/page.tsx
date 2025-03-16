"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mic, Volume2, Loader2, Settings, Calendar, Moon, Sun, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { AppIcon } from "@/components/app-icon"
import Link from "next/link"
import { useTheme } from "next-themes"

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "zh", name: "Chinese" },
  { code: "ig", name: "Igbo" },
  { code: "ha", name: "Hausa" },
  { code: "yo", name: "Yoruba" },
]

type HistoryItem = {
  id: string
  originalText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  timestamp: Date
}

export default function Home() {
  const [sourceLanguage, setSourceLanguage] = useState("en")
  const [targetLanguage, setTargetLanguage] = useState("es")
  const [isRecording, setIsRecording] = useState(false)
  const [originalText, setOriginalText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [colorTheme, setColorTheme] = useState<"blue" | "green">("blue")

  const { theme, setTheme } = useTheme()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Initialize audio element for playback
    audioRef.current = new Audio()

    // Load history from localStorage
    const savedHistory = localStorage.getItem("translationHistory")
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error("Error parsing saved history:", error)
      }
    }

    return () => {
      // Clean up
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("translationHistory", JSON.stringify(history))
    }
  }, [history])

  useEffect(() => {
    // Simulate checking for microphone permissions and API availability
    const checkAvailability = async () => {
      try {
        // Check if browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast({
            title: "Browser Not Supported",
            description: "Your browser doesn't support microphone access. Please try a different browser.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error checking availability:", error)
      } finally {
        // Set loading to false after a short delay to prevent flash
        setTimeout(() => setIsLoading(false), 1000)
      }
    }

    checkAvailability()
  }, [])

  useEffect(() => {
    // Set initial color theme
    document.documentElement.style.setProperty("--primary-color", colorTheme === "blue" ? "#1e3565" : "#99d08c")
  }, [colorTheme])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        await processAudio(audioBlob)

        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    try {
      setIsTranslating(true)

      // Step 1: Convert speech to text
      const formData = new FormData()
      formData.append("audio", audioBlob)
      formData.append("sourceLanguage", sourceLanguage)

      // Check if custom API key exists
      const customDeepgramKey = localStorage.getItem("deepgramApiKey")

      const headers: HeadersInit = {}
      if (customDeepgramKey && customDeepgramKey.trim() !== "") {
        headers["X-Custom-Deepgram-Key"] = customDeepgramKey
      }

      const transcriptionResponse = await fetch("/api/speech-to-text", {
        method: "POST",
        headers,
        body: formData,
      })

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json()
        throw new Error(errorData.error || "Speech-to-text failed")
      }

      const { text } = await transcriptionResponse.json()

      if (!text || text.trim() === "") {
        toast({
          title: "No Speech Detected",
          description: "We couldn't detect any speech in the recording. Please try again.",
          variant: "destructive",
        })
        setIsTranslating(false)
        return
      }

      setOriginalText(text)

      // Step 2: Translate the text
      const customOpenAIKey = localStorage.getItem("openaiApiKey")

      const translationHeaders: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (customOpenAIKey && customOpenAIKey.trim() !== "") {
        translationHeaders["X-Custom-OpenAI-Key"] = customOpenAIKey
      }

      const translationResponse = await fetch("/api/translate", {
        method: "POST",
        headers: translationHeaders,
        body: JSON.stringify({
          text,
          sourceLanguage,
          targetLanguage,
        }),
      })

      if (!translationResponse.ok) {
        const errorData = await translationResponse.json()
        throw new Error(errorData.error || "Translation failed")
      }

      const { translatedText: translation } = await translationResponse.json()
      setTranslatedText(translation)

      // Auto-play the translation if enabled
      if (autoPlay) {
        setTimeout(() => {
          speakTranslatedText()
        }, 500)
      }
    } catch (error) {
      console.error("Error processing audio:", error)
      toast({
        title: "Processing Error",
        description:
          error instanceof Error ? error.message : "An error occurred while processing your speech. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTranslating(false)
    }
  }

  const speakTranslatedText = async () => {
    if (!translatedText) return

    try {
      setIsSpeaking(true)

      const customElevenLabsKey = localStorage.getItem("elevenlabsApiKey")

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (customElevenLabsKey && customElevenLabsKey.trim() !== "") {
        headers["X-Custom-ElevenLabs-Key"] = customElevenLabsKey
      }

      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers,
        body: JSON.stringify({
          text: translatedText,
          language: targetLanguage,
        }),
      })

      if (!response.ok) {
        throw new Error("Text-to-speech failed")
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.onended = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
        }
        audioRef.current.play()
      }
    } catch (error) {
      console.error("Error with text-to-speech:", error)
      toast({
        title: "Speech Error",
        description: "Could not generate speech for the translated text.",
        variant: "destructive",
      })
      setIsSpeaking(false)
    }
  }

  const addToHistory = useCallback(() => {
    if (originalText && translatedText) {
      const historyItem = {
        id: Date.now().toString(),
        originalText,
        translatedText,
        sourceLanguage,
        targetLanguage,
        timestamp: new Date(),
      }

      setHistory((prev) => [historyItem, ...prev.slice(0, 9)]) // Keep only the 10 most recent items
    }
  }, [originalText, translatedText, sourceLanguage, targetLanguage])

  // Add this useEffect to automatically add completed translations to history
  useEffect(() => {
    if (originalText && translatedText && !isTranslating) {
      addToHistory()
    }
  }, [originalText, translatedText, isTranslating, addToHistory])

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem("translationHistory")
    toast({
      title: "History Cleared",
      description: "Your translation history has been cleared.",
    })
  }

  const toggleTheme = () => {
    // Toggle between blue and green color themes
    const newColorTheme = colorTheme === "blue" ? "green" : "blue"
    setColorTheme(newColorTheme)

    // Apply the color theme to the document
    if (newColorTheme === "blue") {
      document.documentElement.style.setProperty("--primary-color", "#1e3565")
    } else {
      document.documentElement.style.setProperty("--primary-color", "#99d08c")
    }

    // Also toggle dark/light mode
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <AppIcon size={48} className="mb-6" />
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
        <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-400">Loading NaoCareTranslate...</h2>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <AppIcon size={32} className="mr-3" />
            <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-400">NaoCareTranslate</h1>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{
                backgroundColor: colorTheme === "blue" ? "#1e3565" : "#99d08c",
                color: "white",
              }}
            >
              {colorTheme === "blue" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Link href="/settings">
              <Button variant="ghost" size="icon" aria-label="Settings">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="w-full space-y-6">
          {/* Language Selection */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Source Language</label>
              <Select value={sourceLanguage} onValueChange={setSourceLanguage} disabled={isRecording || isTranslating}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={`source-${lang.code}`} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Target Language</label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage} disabled={isRecording || isTranslating}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={`target-${lang.code}`} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Auto-play translation</span>
            </label>

            <Link href="/request-interpreter">
              <Button variant="outline" size="sm" className="text-sm">
                <Calendar className="h-4 w-4 mr-2" />
                Request Interpreter
              </Button>
            </Link>
          </div>

          {/* Recording Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              className={`rounded-full p-8 ${
                isRecording ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
              }`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranslating}
            >
              <Mic className={`h-8 w-8 ${isRecording ? "animate-pulse" : ""}`} />
              <span className="ml-2">{isRecording ? "Stop Recording" : "Start Recording"}</span>
            </Button>
          </div>

          {/* Transcripts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Text */}
            <Card className="p-4 h-64 overflow-auto">
              <h2 className="text-lg font-semibold mb-2">Original Text</h2>
              <div className="border-t pt-2">
                {isTranslating ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <p>{originalText || "Your speech will appear here..."}</p>
                )}
              </div>
            </Card>

            {/* Translated Text */}
            <Card className="p-4 h-64 overflow-auto">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Translated Text</h2>
                {translatedText && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={speakTranslatedText}
                    disabled={isSpeaking || isTranslating}
                  >
                    {isSpeaking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              <div className="border-t pt-2">
                {isTranslating ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <p>{translatedText || "Translation will appear here..."}</p>
                )}
              </div>
            </Card>
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            <p>Speak clearly into your microphone. For best results, use in a quiet environment.</p>
          </div>

          {history.length > 0 && (
            <div className="mt-8 w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-400">Recent Translations</h2>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                    {showHistory ? "Hide History" : "Show History"}
                  </Button>

                  {history.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearHistory}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {showHistory && (
                <div className="space-y-4">
                  {history.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {languages.find((l) => l.code === item.sourceLanguage)?.name || item.sourceLanguage}
                          </p>
                          <p>{item.originalText}</p>
                        </div>
                        <div>
                          <div className="flex justify-between">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                              {languages.find((l) => l.code === item.targetLanguage)?.name || item.targetLanguage}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setTranslatedText(item.translatedText)
                                speakTranslatedText()
                              }}
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p>{item.translatedText}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

