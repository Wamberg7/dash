import { useState, useEffect } from 'react'

export function useScrollSpy(ids: string[], offset: number = 0) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + offset

      // Find the section that is currently in view
      for (const id of ids) {
        const element = document.getElementById(id)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveId(id)
            return
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check on mount

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [ids, offset])

  return activeId
}
