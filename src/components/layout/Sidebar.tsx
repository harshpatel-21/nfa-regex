/**
 * AI assistance was used mainly for styling in this component
 * (visual presentation, class tuning, and UI polish).
 */
import { useRef, useState, useCallback } from 'react'
import { useNFA } from '../../hooks/useNFA'
import { NFAInputPanel } from '../nfa-input/NFAInputPanel'
import { NfaToRegexPanel } from '../conversion/NfaToRegexPanel'
import { RegexToNFAPanel } from '../conversion/RegexToNFAPanel'

const MIN_WIDTH = 280
const MAX_WIDTH = 700
const DEFAULT_WIDTH = 400

export function Sidebar() {
  const { appMode, nfaToRegexPhase } = useNFA()
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const dragging = useRef(false)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    setWidth((prev) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, prev + e.movementX)))
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  return (
    <aside
      className="shrink-0 border-r border-gray-200 bg-white overflow-y-auto relative"
      style={{ width }}
    >
      {appMode === 'nfa-to-regex' && nfaToRegexPhase === 'input' && (
        <NFAInputPanel />
      )}
      {appMode === 'nfa-to-regex' && nfaToRegexPhase === 'converting' && (
        <NfaToRegexPanel />
      )}
      {appMode === 'regex-to-nfa' && <RegexToNFAPanel />}

      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 h-full w-2 flex items-center justify-center cursor-col-resize group z-10 select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Visual indicator — thin bar + arrows centred on it */}
        <div className="w-1 h-full bg-gray-200 group-hover:bg-blue-400 transition-colors"/>
        <div className="absolute flex flex-col items-center gap-0.5 pointer-events-none">
          <div className="w-0.5 h-4 bg-gray-400 group-hover:bg-blue-500" />
        </div>
      </div>
    </aside>
  )
}
