'use client'

import { motion } from 'framer-motion'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent
} from 'react'

import { XIcon } from '@/components/icons'
import { wordlist } from '@/constants/wordlists/english'
import { cls } from '@/libs/utils'

export function InputComponent({
  defaultValues,
  onChange
}: Readonly<{
  defaultValues?: string
  onChange?: (tags: string) => void
}>) {
  // __STATE's
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [tags, setTags] = useState<string[]>(defaultValues?.split(/\s+/) || [])
  const [inputValue, setInputValue] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)

  const suggestions = useMemo(() => {
    // Filter suggestions based on input and exclude already selected tags
    // Limit to 5 suggestions
    return wordlist
      .filter((word) => word.startsWith(inputValue.toLowerCase()) && !tags.includes(word))
      .slice(0, 5)
  }, [tags, inputValue])

  // __FUNCTION's
  const addTag = useCallback(
    (tag: string) => {
      if (tag.trim() && !tags.includes(tag.trim())) {
        setTags((prev) => [...prev, tag.trim()])
        setInputValue('')
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    },
    [tags]
  )

  const removeTag = useCallback((indexToRemove: number) => {
    setTags((prev) => prev.filter((_, index) => index !== indexToRemove))
  }, [])

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setIsOpen(true)
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      switch (e.code) {
        case 'ArrowUp':
          e.preventDefault()
          if (isOpen && suggestions.length > 0) {
            setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
          }
          break

        case 'ArrowDown':
          e.preventDefault()
          if (isOpen && suggestions.length > 0) {
            setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
          }
          break

        case 'NumpadEnter':
        case 'Enter':
        case 'Space':
          e.preventDefault()
          if (isOpen && highlightedIndex > -1) {
            addTag(suggestions[highlightedIndex])
          } else if (inputValue.trim()) {
            addTag(inputValue)
          }
          break

        case 'Backspace':
          if (inputValue === '' && tags.length > 0) {
            removeTag(tags.length - 1)
          }
          break

        case 'Escape':
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
      }
    },
    [tags, inputValue, suggestions, isOpen, highlightedIndex, addTag, removeTag]
  )

  // __EFFECT's
  useEffect(() => {
    onChange?.(tags.join(' '))
  }, [tags, onChange])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // __RENDER
  return (
    <div className='ring-foreground-50 focus-within:ring-foreground-100 rounded-xs p-4 ring-1 focus-within:ring-2'>
      <div className='flex flex-wrap items-center gap-1.5'>
        {tags.map((tag, index) => (
          <motion.div
            className='font-number ring-foreground-50 bg-foreground-50/50 flex h-6 items-center gap-1 rounded-xs px-2 ring-1 select-none'
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            key={`tag-${tag}-${index}`}>
            <span className='text-foreground-400 text-sm font-medium'>{index + 1}.</span>
            <span className='font-medium'>{tag}</span>
          </motion.div>
        ))}

        <div className='relative min-w-28 flex-1'>
          <input
            className='h-6 w-full px-1 outline-none'
            type='text'
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              setIsOpen(Boolean(e.target.value && suggestions.length > 0))
            }}
          />

          {/* Suggestions Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <motion.div
              className='bg-background ring-foreground-50 absolute inset-x-0 z-50 mt-1 rounded-xs p-0 shadow-xl ring-1'
              ref={dropdownRef}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}>
              <ul className='flex flex-col gap-1 p-2'>
                {suggestions.map((suggestion, index) => (
                  <li
                    className={cls(`text-foreground-600 rounded-xs px-2 py-1 transition-all duration-100`, {
                      'bg-foreground-50/50 text-foreground ring-foreground-50/75 ring-1':
                        index === highlightedIndex
                    })}
                    key={suggestion}>
                    <span className='font-number font-medium'>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
