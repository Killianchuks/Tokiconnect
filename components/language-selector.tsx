"use client"
import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { languages, regions, type Language } from "@/lib/languages-data"

// Re-export for backward compatibility
export { languages, regions }

interface LanguageSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function LanguageSelector({ value, onChange, placeholder = "Select a language" }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(value)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredLanguages, setFilteredLanguages] = useState(languages)

  useEffect(() => {
    setSelectedLanguage(value)
  }, [value])

  // Filter languages based on search query (searches label, native name, and region)
  useEffect(() => {
    if (!searchQuery) {
      setFilteredLanguages(languages)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = languages.filter((language) => 
      language.label.toLowerCase().includes(query) ||
      language.region.toLowerCase().includes(query) ||
      (language.nativeName && language.nativeName.toLowerCase().includes(query))
    )
    setFilteredLanguages(filtered)
  }, [searchQuery])

  const handleSelect = (currentValue: string) => {
    setSelectedLanguage(currentValue)
    onChange(currentValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedLanguage ? languages.find((language) => language.value === selectedLanguage)?.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search language..." value={searchQuery} onValueChange={setSearchQuery} autoFocus />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {filteredLanguages.map((language) => (
                <CommandItem key={language.value} value={language.value} onSelect={handleSelect}>
                  <Check
                    className={cn("mr-2 h-4 w-4", selectedLanguage === language.value ? "opacity-100" : "opacity-0")}
                  />
                  <div className="flex flex-col">
                    <span>{language.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {language.nativeName && language.nativeName !== language.label ? `${language.nativeName} • ` : ""}{language.region}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
