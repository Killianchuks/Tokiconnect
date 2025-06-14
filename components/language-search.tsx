"use client"

import { useState, useCallback, useEffect } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { languages } from "@/components/language-selector"

interface LanguageSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function LanguageSearch({
  value,
  onChange,
  placeholder = "Search for a language...",
  className,
}: LanguageSearchProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredLanguages, setFilteredLanguages] = useState(languages)

  // Filter languages based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredLanguages(languages)
      return
    }

    const filtered = languages.filter((language) => language.label.toLowerCase().includes(searchQuery.toLowerCase()))
    setFilteredLanguages(filtered)
  }, [searchQuery])

  const handleSelect = useCallback(
    (currentValue: string) => {
      onChange(currentValue === value ? "" : currentValue)
      setOpen(false)
    },
    [value, onChange],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          onClick={() => setSearchQuery("")}
        >
          <div className="flex items-center">
            {value ? (
              languages.find((language) => language.value === value)?.label
            ) : (
              <span className="text-muted-foreground flex items-center">
                <Search className="mr-2 h-4 w-4" />
                {placeholder}
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search languages..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9"
            autoFocus
          />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {filteredLanguages.map((language) => (
                <CommandItem key={language.value} value={language.value} onSelect={handleSelect}>
                  <Check className={cn("mr-2 h-4 w-4", value === language.value ? "opacity-100" : "opacity-0")} />
                  {language.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
