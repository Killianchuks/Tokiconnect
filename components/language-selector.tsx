"use client"
import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Comprehensive language list derived from global language data
export const languages = [
  // African Languages
  { value: "yoruba", label: "Yoruba" },
  { value: "igbo", label: "Igbo" },
  { value: "hausa", label: "Hausa" },
  { value: "swahili", label: "Swahili" },
  { value: "zulu", label: "Zulu" },
  { value: "xhosa", label: "Xhosa" },
  { value: "afrikaans", label: "Afrikaans" },
  { value: "sotho", label: "Sotho" },
  { value: "tswana", label: "Tswana" },
  { value: "amharic", label: "Amharic" },
  { value: "oromo", label: "Oromo" },
  { value: "tigrinya", label: "Tigrinya" },
  { value: "somali", label: "Somali" },
  { value: "arabic", label: "Arabic" },
  { value: "berber", label: "Berber" },
  { value: "akan", label: "Akan" },
  { value: "ewe", label: "Ewe" },
  { value: "ga", label: "Ga" },
  { value: "wolof", label: "Wolof" },
  { value: "fulani", label: "Fulani" },
  { value: "kongo", label: "Kongo" },
  { value: "lingala", label: "Lingala" },
  { value: "luganda", label: "Luganda" },
  { value: "kikuyu", label: "Kikuyu" },
  { value: "malagasy", label: "Malagasy" },
  { value: "shona", label: "Shona" },
  { value: "ndebele", label: "Ndebele" },

  // Asian Languages
  { value: "mandarin", label: "Mandarin" },
  { value: "cantonese", label: "Cantonese" },
  { value: "wu", label: "Wu (Shanghainese)" },
  { value: "min", label: "Min" },
  { value: "hakka", label: "Hakka" },
  { value: "hindi", label: "Hindi" },
  { value: "bengali", label: "Bengali" },
  { value: "telugu", label: "Telugu" },
  { value: "marathi", label: "Marathi" },
  { value: "tamil", label: "Tamil" },
  { value: "urdu", label: "Urdu" },
  { value: "gujarati", label: "Gujarati" },
  { value: "kannada", label: "Kannada" },
  { value: "malayalam", label: "Malayalam" },
  { value: "japanese", label: "Japanese" },
  { value: "korean", label: "Korean" },
  { value: "vietnamese", label: "Vietnamese" },
  { value: "thai", label: "Thai" },
  { value: "indonesian", label: "Indonesian" },
  { value: "javanese", label: "Javanese" },
  { value: "sundanese", label: "Sundanese" },
  { value: "balinese", label: "Balinese" },
  { value: "filipino", label: "Filipino" },
  { value: "tagalog", label: "Tagalog" },
  { value: "cebuano", label: "Cebuano" },
  { value: "ilocano", label: "Ilocano" },
  { value: "malay", label: "Malay" },
  { value: "hebrew", label: "Hebrew" },
  { value: "turkish", label: "Turkish" },
  { value: "kazakh", label: "Kazakh" },
  { value: "uzbek", label: "Uzbek" },
  { value: "uyghur", label: "Uyghur" },
  { value: "kyrgyz", label: "Kyrgyz" },
  { value: "tajik", label: "Tajik" },
  { value: "turkmen", label: "Turkmen" },
  { value: "mongolian", label: "Mongolian" },
  { value: "nepali", label: "Nepali" },
  { value: "sinhalese", label: "Sinhalese" },
  { value: "khmer", label: "Khmer" },
  { value: "lao", label: "Lao" },
  { value: "burmese", label: "Burmese" },
  { value: "tibetan", label: "Tibetan" },

  // European Languages
  { value: "english", label: "English" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "spanish", label: "Spanish" },
  { value: "catalan", label: "Catalan" },
  { value: "basque", label: "Basque" },
  { value: "galician", label: "Galician" },
  { value: "italian", label: "Italian" },
  { value: "sicilian", label: "Sicilian" },
  { value: "sardinian", label: "Sardinian" },
  { value: "welsh", label: "Welsh" },
  { value: "scottish_gaelic", label: "Scottish Gaelic" },
  { value: "irish", label: "Irish" },
  { value: "russian", label: "Russian" },
  { value: "ukrainian", label: "Ukrainian" },
  { value: "polish", label: "Polish" },
  { value: "dutch", label: "Dutch" },
  { value: "frisian", label: "Frisian" },
  { value: "swedish", label: "Swedish" },
  { value: "norwegian", label: "Norwegian" },
  { value: "finnish", label: "Finnish" },
  { value: "danish", label: "Danish" },
  { value: "greek", label: "Greek" },
  { value: "portuguese", label: "Portuguese" },
  { value: "czech", label: "Czech" },
  { value: "hungarian", label: "Hungarian" },
  { value: "romanian", label: "Romanian" },
  { value: "bulgarian", label: "Bulgarian" },
  { value: "serbian", label: "Serbian" },
  { value: "croatian", label: "Croatian" },
  { value: "albanian", label: "Albanian" },
  { value: "macedonian", label: "Macedonian" },
  { value: "slovenian", label: "Slovenian" },
  { value: "slovak", label: "Slovak" },
  { value: "belarusian", label: "Belarusian" },
  { value: "lithuanian", label: "Lithuanian" },
  { value: "latvian", label: "Latvian" },
  { value: "estonian", label: "Estonian" },
  { value: "maltese", label: "Maltese" },
  { value: "icelandic", label: "Icelandic" },
  { value: "faroese", label: "Faroese" },

  // North American Languages
  { value: "nahuatl", label: "Nahuatl" },
  { value: "maya", label: "Maya" },
  { value: "zapotec", label: "Zapotec" },
  { value: "haitian_creole", label: "Haitian Creole" },
  { value: "navajo", label: "Navajo" },
  { value: "inuktitut", label: "Inuktitut" },
  { value: "cree", label: "Cree" },
  { value: "quiche", label: "Quiché" },
  { value: "kaqchikel", label: "Kaqchikel" },
  { value: "mam", label: "Mam" },
  { value: "ojibwe", label: "Ojibwe" },
  { value: "cherokee", label: "Cherokee" },
  { value: "dakota", label: "Dakota" },
  { value: "apache", label: "Apache" },
  { value: "mohawk", label: "Mohawk" },
  { value: "yucatec", label: "Yucatec" },
  { value: "mixtec", label: "Mixtec" },

  // South American Languages
  { value: "quechua", label: "Quechua" },
  { value: "aymara", label: "Aymara" },
  { value: "guarani", label: "Guarani" },
  { value: "mapudungun", label: "Mapudungun" },
  { value: "tupi", label: "Tupi" },
  { value: "kichwa", label: "Kichwa" },
  { value: "wayuu", label: "Wayuu" },
  { value: "arawak", label: "Arawak" },
  { value: "yanomami", label: "Yanomami" },
  { value: "embera", label: "Embera" },
  { value: "shipibo", label: "Shipibo" },

  // Oceanian Languages
  { value: "maori", label: "Māori" },
  { value: "tok_pisin", label: "Tok Pisin" },
  { value: "hiri_motu", label: "Hiri Motu" },
  { value: "fijian", label: "Fijian" },
  { value: "solomon_islands_pijin", label: "Solomon Islands Pijin" },
  { value: "hawaiian", label: "Hawaiian" },
  { value: "samoan", label: "Samoan" },
  { value: "tongan", label: "Tongan" },
  { value: "tahitian", label: "Tahitian" },
  { value: "marshallese", label: "Marshallese" },
  { value: "palauan", label: "Palauan" },
  { value: "chamorro", label: "Chamorro" },
  { value: "aboriginal", label: "Aboriginal" },
  { value: "warlpiri", label: "Warlpiri" },
  { value: "pitjantjatjara", label: "Pitjantjatjara" },
].sort((a, b) => a.label.localeCompare(b.label))

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

  // Filter languages based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredLanguages(languages)
      return
    }

    const filtered = languages.filter((language) => language.label.toLowerCase().includes(searchQuery.toLowerCase()))
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
