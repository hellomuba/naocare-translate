"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppIcon } from "@/components/app-icon"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const [deepgramApiKey, setDeepgramApiKey] = useState("")
  const [openaiApiKey, setOpenaiApiKey] = useState("")
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    // Load saved API keys from localStorage
    const savedDeepgramKey = localStorage.getItem("deepgramApiKey") || ""
    const savedOpenaiKey = localStorage.getItem("openaiApiKey") || ""
    const savedElevenlabsKey = localStorage.getItem("elevenlabsApiKey") || ""

    setDeepgramApiKey(savedDeepgramKey)
    setOpenaiApiKey(savedOpenaiKey)
    setElevenlabsApiKey(savedElevenlabsKey)
  }, [])

  const saveSettings = () => {
    setIsSaving(true)

    try {
      // Save API keys to localStorage
      localStorage.setItem("deepgramApiKey", deepgramApiKey)
      localStorage.setItem("openaiApiKey", openaiApiKey)
      localStorage.setItem("elevenlabsApiKey", elevenlabsApiKey)

      toast({
        title: "Settings Saved",
        description: "Your API keys have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error Saving Settings",
        description: "There was an error saving your settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const clearHistory = () => {
    try {
      localStorage.removeItem("translationHistory")
      toast({
        title: "History Cleared",
        description: "Your translation history has been cleared successfully.",
      })
    } catch (error) {
      console.error("Error clearing history:", error)
      toast({
        title: "Error Clearing History",
        description: "There was an error clearing your history. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-3xl">
        <div className="flex items-center mb-8">
          <Link href="/" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-400">Settings</h1>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Override the default API keys with your own credentials. Your keys are stored locally on your device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deepgram-api-key">Deepgram API Key</Label>
                <Input
                  id="deepgram-api-key"
                  type="password"
                  placeholder="Enter your Deepgram API key"
                  value={deepgramApiKey}
                  onChange={(e) => setDeepgramApiKey(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-api-key">OpenAI API Key</Label>
                <Input
                  id="openai-api-key"
                  type="password"
                  placeholder="Enter your OpenAI API key"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="elevenlabs-api-key">ElevenLabs API Key</Label>
                <Input
                  id="elevenlabs-api-key"
                  type="password"
                  placeholder="Enter your ElevenLabs API key"
                  value={elevenlabsApiKey}
                  onChange={(e) => setElevenlabsApiKey(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings} disabled={isSaving}>
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save API Keys
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the appearance of the application.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="theme-toggle">Dark Mode</Label>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="theme-toggle"
                    className="sr-only peer"
                    checked={theme === "dark"}
                    onChange={() => setTheme(theme === "dark" ? "light" : "dark")}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Manage your translation history and data.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={clearHistory}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Translation History
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>Information about NaoCareTranslate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <AppIcon size={40} />
                <div>
                  <h3 className="text-lg font-semibold">NaoCareTranslate</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0</p>
                </div>
              </div>
              <p className="text-sm">
                NaoCareTranslate provides real-time, multilingual translation between patients and healthcare providers
                using AI-powered speech recognition and translation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

