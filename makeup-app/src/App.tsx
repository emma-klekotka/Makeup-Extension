import './App.css'
import { useCurrentTabUrl } from './getUrl'
import { generateGeminiResponse } from './geminiCall'
import { useEffect, useState } from 'react'


function App() {
  const url = useCurrentTabUrl()

  const [geminiResponse, setGeminiResponse] = useState<string|null>('')
  
  useEffect(() => {
    if (url) {
      generateGeminiResponse(url).then(response => {
        setGeminiResponse(response || 'No response from Gemini API');
      }).catch(error => {
        console.error('Gemini API error:', error);
        setGeminiResponse(`Error: ${error.message}`);
      })
    }
  }, [url])


  return (
    <div>
      <h1>I love makeup!</h1>
      <p>Current tab URL: {url}</p>
      <p>Gemini API Response: {geminiResponse}</p>
    </div>
  )
}

export default App
