### NaoCareTranslate: Code Structure, AI Tools, and User Guide

## Code Structure Highlights

### Core Components

1. **Main Application (`app/page.tsx`)**

1. Handles recording, translation, and playback functionality
2. Manages state for languages, recording, translation, and history
3. Implements theme toggling between custom colors (`#1e3565` and `#99d08c`)



2. **API Integration Routes**

1. `app/api/speech-to-text/route.ts`: Handles audio processing with Deepgram
2. `app/api/translate/route.ts`: Manages translation with OpenAI
3. `app/api/text-to-speech/route.ts`: Converts text to speech with ElevenLabs



3. **Settings Management (`app/settings/page.tsx`)**

1. Provides interface for custom API keys
2. Manages theme preferences
3. Handles history clearing functionality



4. **Interpreter Request (`app/request-interpreter/page.tsx`)**

1. Form for requesting human interpreters
2. Handles appointment scheduling and contact information



5. **UI Components**

1. `components/app-icon.tsx`: Custom app icon
2. Various shadcn/ui components for consistent design





### Key Code Sections

```javascript
// Color theme implementation
const [colorTheme, setColorTheme] = useState<'blue' | 'green'>('blue');

useEffect(() => {
  // Set initial color theme
  document.documentElement.style.setProperty('--primary-color', 
    colorTheme === 'blue' ? '#1e3565' : '#99d08c');
}, [colorTheme]);

// Theme toggle function
const toggleTheme = () => {
  // Toggle between blue and green color themes
  const newColorTheme = colorTheme === 'blue' ? 'green' : 'blue';
  setColorTheme(newColorTheme);
  
  // Apply the color theme to the document
  document.documentElement.style.setProperty('--primary-color', 
    newColorTheme === 'blue' ? '#1e3565' : '#99d08c');
  
  // Also toggle dark/light mode
  setTheme(theme === "dark" ? "light" : "dark");
};
```

```javascript
// Custom API key handling in API routes
const customApiKey = request.headers.get("X-Custom-Deepgram-Key");
const apiKey = customApiKey || process.env.DEEPGRAM_API_KEY;

if (!apiKey) {
  return NextResponse.json(
    { error: "Deepgram API key is missing" },
    { status: 400 }
  );
}
```

```javascript
// Translation history management
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
    
    setHistory((prev) => [historyItem, ...prev.slice(0, 9)]); // Keep only the 10 most recent items
  }
}, [originalText, translatedText, sourceLanguage, targetLanguage]);
```

## AI Tools Integration

### 1. Deepgram

- **Purpose**: Converts spoken audio to text
- **Implementation**:

- Audio is recorded in the browser and sent to the `/api/speech-to-text` endpoint
- The endpoint forwards the audio to Deepgram's API with language parameters
- Returns transcribed text for translation





### 2. OpenAI (GPT-4o)

- **Purpose**: Translates medical text between languages
- **Implementation**:

- Transcribed text is sent to `/api/translate` with source and target languages
- Uses a specialized system prompt for medical translation accuracy
- Returns translated text with medical terminology preserved





### 3. ElevenLabs

- **Purpose**: Generates natural-sounding speech from translated text
- **Implementation**:

- Translated text is sent to `/api/text-to-speech` with target language
- Uses language-specific voice models for authentic pronunciation
- Returns audio stream for playback in the browser





## Security Considerations

1. **API Key Management**

1. Environment variables for default API keys
2. Client-side localStorage for user-provided API keys
3. Custom headers for passing keys to backend services



2. **Data Privacy**

1. No permanent storage of audio recordings
2. Translation history stored only in browser localStorage
3. No transmission of data to third parties beyond necessary API calls



3. **User Control**

1. Ability to clear translation history
2. Option to use personal API keys instead of application defaults
3. Microphone access only when explicitly initiated by user





## User Guide

### Basic Translation

1. **Select Languages**

1. Choose your source language (what you'll speak)
2. Choose your target language (what you need translation into)



2. **Record Your Speech**

1. Click the "Start Recording" button (large blue button with microphone icon)
2. Speak clearly into your microphone
3. Click "Stop Recording" when finished



3. **View and Listen to Translation**

1. Your original speech appears in the left panel
2. The translation appears in the right panel
3. Click the speaker icon next to the translation to hear it spoken aloud



4. **Auto-Play Option**

1. Check the "Auto-play translation" box to automatically hear translations





### Managing Translation History

1. **View History**

1. Scroll down to see "Recent Translations" section
2. Click "Show History" to expand the list of past translations



2. **Replay Past Translations**

1. Click the speaker icon next to any past translation to hear it again



3. **Clear History**

1. Click the "Clear" button to remove all translation history





### Customizing Settings

1. **Access Settings**

1. Click the gear icon in the top-right corner



2. **API Keys**

1. Enter your own API keys for Deepgram, OpenAI, and ElevenLabs
2. Click "Save API Keys" to store them locally



3. **Theme Preferences**

1. Toggle between light and dark mode
2. Toggle between blue (`#1e3565`) and green (`#99d08c`) color themes



4. **Data Management**

1. Clear translation history from the settings page





### Requesting a Human Interpreter

1. **Access Request Form**

1. Click "Request Interpreter" button on the main page



2. **Complete the Form**

1. Select the required language
2. Choose appointment date and time
3. Enter your contact information
4. Add any special notes or requirements



3. **Submit Request**

1. Click "Submit Request" to send your interpreter booking
