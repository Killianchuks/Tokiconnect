"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Define the props interface for LanguageSearch
interface LanguageOption {
  value: string;
  label: string;
}

interface LanguageSearchProps {
  value: string; // The currently selected language value
  onChange: (value: string) => void; // Callback when a language is selected
  options: LanguageOption[]; // Array of language options
  placeholder?: string; // Placeholder text for the input
  className?: string; // Optional className for styling
}

export function LanguageSearch({ value, onChange, options, placeholder = "Select language...", className }: LanguageSearchProps) {
  const [open, setOpen] = React.useState(false)

  // Find the selected label based on the value
  const selectedLabel = options.find((option) => option.value.toLowerCase() === value.toLowerCase())?.label || "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {value && value !== "all" ? selectedLabel : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandEmpty>No language found.</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label} // Use label for searchability, value for selecting
                onSelect={(currentLabel) => {
                  const selectedOption = options.find(o => o.label.toLowerCase() === currentLabel.toLowerCase());
                  if (selectedOption) {
                      onChange(selectedOption.value === value ? "all" : selectedOption.value); // Toggle or set
                  } else {
                      onChange("all"); // If label doesn't match, reset to "all"
                  }
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.toLowerCase() === option.value.toLowerCase() ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
