import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, Search, FileText, Loader2, Tag, Clock,
} from 'lucide-react'
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '../../hooks/useNotes'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import Link from '@tiptap/extension-link'

const lowlight = createLowlight(common)

function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null
  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-white/10 flex-shrink-0 flex-wrap">
      <button onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded text-xs transition-colors ${editor.isActive('bold') ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}>
        <strong>B</strong>
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded text-xs transition-colors ${editor.isActive('italic') ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}>
        <em>I</em>
      </button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`px-2 py-1 rounded text-xs transition-colors ${editor.isActive('strike') ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}>
        <s>S</s>
      </button>
      <span className="w-px h-4 bg-white/10 mx-1" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-2 py-1 rounded text-xs transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}>
        H1
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 rounded text-xs transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}>
        H2
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2 py-1 rounded text-xs transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}>
        H3
      </button>
      <span className="w-px h-4 bg-white/10 mx-1" />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded text-xs transition-colors ${editor.isActive('bulletList') ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}>
        • List
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 rounded text-xs transition-colors ${editor.isActive('orderedList') ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}>
        1. List
      </button>
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`px-2 py-1 rounded text-xs transition-colors ${editor.isActive('codeBlock') ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}>
        {'</>'}
      </button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-2 py-1 rounded text-xs transition-colors ${editor.isActive('blockquote') ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}>
        " Quote
      </button>
    </div>
  )
}

export function NoteApp() {
  const { data: notes = [], isLoading } = useNotes()
  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('')
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const selectedNote = notes.find((n: any) => n.id === selectedId)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
      CodeBlockLowlight.configure({ lowlight }),
      Link.configure({ openOnClick: false }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none px-6 py-4 min-h-full',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (!selectedId) return
      if (saveTimer) clearTimeout(saveTimer)
      const timer = setTimeout(() => {
        updateNote.mutate({ id: selectedId, content: ed.getJSON(), title: title || 'Untitled' })
      }, 800)
      setSaveTimer(timer)
    },
  })

  useEffect(() => {
    if (selectedNote && editor) {
      const content = selectedNote.content
      if (content && typeof content === 'object') {
        editor.commands.setContent(content)
      } else if (typeof content === 'string') {
        editor.commands.setContent(content)
      } else {
        editor.commands.clearContent()
      }
      setTitle(selectedNote.title || '')
    }
  }, [selectedId])

  const handleCreate = async () => {
    const note = await createNote.mutateAsync({ title: 'Untitled', content: {} })
    setSelectedId(note.id)
  }

  const handleDelete = (id: string) => {
    deleteNote.mutate(id)
    if (selectedId === id) {
      setSelectedId(null)
      editor?.commands.clearContent()
      setTitle('')
    }
  }

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle)
    if (!selectedId) return
    if (saveTimer) clearTimeout(saveTimer)
    const timer = setTimeout(() => {
      updateNote.mutate({ id: selectedId, title: newTitle })
    }, 800)
    setSaveTimer(timer)
  }, [selectedId, saveTimer])

  const filtered = notes.filter((n: any) =>
    !search || (n.title || '').toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return d }
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-white/10 flex flex-col bg-black/10">
        <div className="p-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm font-medium">Notes</span>
            <button onClick={handleCreate} disabled={createNote.isPending}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
              {createNote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/80 text-xs placeholder-white/30 focus:border-white/20 focus:outline-none" />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-white/30 text-xs py-8">
              {search ? 'No matching notes' : 'No notes yet'}
            </div>
          ) : (
            filtered.map((note: any) => (
              <div key={note.id}
                onClick={() => setSelectedId(note.id)}
                className={`px-3 py-2.5 cursor-pointer border-b border-white/5 group transition-colors ${
                  selectedId === note.id ? 'bg-desktop-accent/15 border-l-2 border-l-desktop-accent' : 'hover:bg-white/5'
                }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium truncate ${selectedId === note.id ? 'text-white' : 'text-white/70'}`}>
                    {note.title || 'Untitled'}
                  </span>
                  <button onClick={e => { e.stopPropagation(); handleDelete(note.id) }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all">
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-2.5 h-2.5 text-white/20" />
                  <span className="text-[10px] text-white/30">{formatDate(note.updatedAt)}</span>
                  {note.tags?.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5 text-white/20" />
                      <span className="text-[10px] text-white/30">{note.tags.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedId && selectedNote ? (
          <>
            <div className="px-6 py-3 border-b border-white/10 flex-shrink-0">
              <input value={title} onChange={e => handleTitleChange(e.target.value)}
                placeholder="Note title"
                className="w-full bg-transparent text-white text-lg font-semibold placeholder-white/30 focus:outline-none" />
            </div>
            <EditorToolbar editor={editor} />
            <div className="flex-1 overflow-auto">
              <EditorContent editor={editor} />
            </div>
            <div className="px-6 py-1.5 border-t border-white/10 flex items-center justify-between text-white/30 text-[10px] flex-shrink-0">
              <span>{updateNote.isPending ? 'Saving...' : 'Saved'}</span>
              <span>{formatDate(selectedNote.updatedAt)}</span>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white/20">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Select a note or create a new one</p>
            <button onClick={handleCreate}
              className="mt-3 px-4 py-2 bg-desktop-accent/20 hover:bg-desktop-accent/30 rounded-lg text-desktop-accent text-sm transition-colors">
              <Plus className="w-4 h-4 inline mr-1" /> New Note
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
