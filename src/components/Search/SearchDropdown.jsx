import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function SearchDropdown({ projectId, onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('work_catalog')
        .select('work_number, employee:employee_id(full_name), manager:manager_id(full_name)')
        .eq('project_id', projectId)
        .ilike('work_number', `${query}%`)
        .limit(8)
      setResults(data ?? [])
      setOpen(true)
    }, 250)
    return () => clearTimeout(timer)
  }, [query, projectId])

  useEffect(() => {
    function onClick(e) { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="search-dropdown" ref={ref}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search work number…"
        onFocus={() => results.length && setOpen(true)}
      />
      {open && results.length > 0 && (
        <ul className="dropdown-list">
          {results.map(r => (
            <li key={r.work_number} onClick={() => { onSelect(r); setOpen(false); setQuery(r.work_number) }}>
              <strong>{r.work_number}</strong>
              <span>{r.employee?.full_name}</span>
              <span>{r.manager?.full_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
