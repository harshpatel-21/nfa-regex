import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { EdgeBendContext, useEdgeBendContext } from '../graph/EdgeBendContext'

describe('EdgeBendContext — defaults', () => {
  it('provides an empty bends map by default', () => {
    const { result } = renderHook(() => useEdgeBendContext())
    expect(result.current.bends).toEqual({})
  })

  it('provides a no-op setEdgeBend that does not throw', () => {
    const { result } = renderHook(() => useEdgeBendContext())
    expect(() => result.current.setEdgeBend('edge-1', 10, 20)).not.toThrow()
  })
})

describe('EdgeBendContext — custom provider', () => {
  it('exposes the bends supplied by a parent provider', () => {
    const customBends = { 'edge-1': { x: 10, y: 20 } }
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <EdgeBendContext.Provider value={{ bends: customBends, setEdgeBend: vi.fn() }}>
        {children}
      </EdgeBendContext.Provider>
    )

    const { result } = renderHook(() => useEdgeBendContext(), { wrapper })
    expect(result.current.bends['edge-1']).toEqual({ x: 10, y: 20 })
  })

  it('calls the provided setEdgeBend with the correct arguments', () => {
    const mockSet = vi.fn()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <EdgeBendContext.Provider value={{ bends: {}, setEdgeBend: mockSet }}>
        {children}
      </EdgeBendContext.Provider>
    )

    const { result } = renderHook(() => useEdgeBendContext(), { wrapper })
    result.current.setEdgeBend('edge-2', 5, 15)
    expect(mockSet).toHaveBeenCalledWith('edge-2', 5, 15)
  })

  it('returns the same setEdgeBend reference provided by the parent', () => {
    const mockSet = vi.fn()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <EdgeBendContext.Provider value={{ bends: {}, setEdgeBend: mockSet }}>
        {children}
      </EdgeBendContext.Provider>
    )

    const { result } = renderHook(() => useEdgeBendContext(), { wrapper })
    expect(result.current.setEdgeBend).toBe(mockSet)
  })
})
