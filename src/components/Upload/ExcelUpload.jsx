import { useCallback, useState } from 'react'
import { importExcelFile } from '@/lib/excelImport'
import toast from 'react-hot-toast'

export default function ExcelUpload({ projectId, onImportComplete }) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFile = useCallback(async (file) => {
    if (!file.name.match(/\.xlsx?$/i)) {
      toast.error('Please upload an Excel (.xlsx) file.')
      return
    }
    setLoading(true)
    try {
      const count = await importExcelFile(file, projectId)
      toast.success(`Imported ${count} work items!`)
      onImportComplete?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const onDrop = useCallback(e => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onInputChange = e => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  return (
    <div
      className={`excel-upload ${dragging ? 'dragging' : ''} ${loading ? 'loading' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {loading ? (
        <p>Importing…</p>
      ) : (
        <>
          <p>Drag & drop your Excel file here</p>
          <span>or</span>
          <label className="browse-btn">
            Browse file
            <input type="file" accept=".xlsx,.xls" hidden onChange={onInputChange} />
          </label>
          <small>Columns required: work_number · employee · manager</small>
        </>
      )}
    </div>
  )
}
