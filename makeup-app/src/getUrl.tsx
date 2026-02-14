import { useEffect, useState } from 'react'

export function useCurrentTabUrl(): string {
  const [url, setUrl] = useState<string>('')

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB_URL' }, (response) => {
      setUrl(response?.url ?? '')
    })
  }, [])

  return url
}
