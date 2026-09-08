import { useState } from 'react'

export type PeopleSearchResult = { id: number; name: string; localName: string | null; controllerName: string | null; roles: string[]; departments: string[] }
export const peopleSearchOptionId = (id: number) => `people-search-option-${id}`

export function usePeopleManagementWorkspace(_domainSlug: string) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PeopleSearchResult[]>([])
  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value
    setQuery(next)
    if (!next.trim()) setResults([])
  }
  return {
    query, results, loading: false, activeIndex: null as number | null, listOpen: query.length > 0,
    inputRef: { current: null } as unknown as React.RefObject<HTMLInputElement>,
    handleQueryChange, handleKeyDown: (_event: React.KeyboardEvent<HTMLInputElement>) => undefined,
    setActiveIndex: (_value: number | null) => undefined,
    selectResult: (id: number) => { window.history.pushState({}, '', `/manage/people/${id}`) },
    setResults,
  }
}
