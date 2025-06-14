"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronDown, ChevronUp, Globe, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"

// Comprehensive language data organized by continent and country
const languageData = [
  {
    continent: "Africa",
    countries: [
      {
        name: "Nigeria",
        languages: ["Yoruba", "Igbo", "Hausa", "English"].sort(),
      },
      {
        name: "South Africa",
        languages: ["Zulu", "Xhosa", "Afrikaans", "English", "Sotho", "Tswana"].sort(),
      },
      {
        name: "Ethiopia",
        languages: ["Amharic", "Oromo", "Tigrinya", "Somali"].sort(),
      },
      {
        name: "Kenya",
        languages: ["Swahili", "English", "Kikuyu", "Luo"].sort(),
      },
      {
        name: "Egypt",
        languages: ["Arabic", "Egyptian Arabic"].sort(),
      },
      {
        name: "Morocco",
        languages: ["Arabic", "Berber", "French"].sort(),
      },
      {
        name: "Ghana",
        languages: ["Akan", "Ewe", "Ga", "English"].sort(),
      },
    ],
  },
  {
    continent: "Asia",
    countries: [
      {
        name: "China",
        languages: ["Mandarin", "Cantonese", "Wu (Shanghainese)", "Min", "Hakka"].sort(),
      },
      {
        name: "India",
        languages: [
          "Hindi",
          "Bengali",
          "Telugu",
          "Marathi",
          "Tamil",
          "Urdu",
          "Gujarati",
          "Kannada",
          "Malayalam",
        ].sort(),
      },
      {
        name: "Japan",
        languages: ["Japanese"].sort(),
      },
      {
        name: "South Korea",
        languages: ["Korean"].sort(),
      },
      {
        name: "Vietnam",
        languages: ["Vietnamese"].sort(),
      },
      {
        name: "Thailand",
        languages: ["Thai"].sort(),
      },
      {
        name: "Indonesia",
        languages: ["Indonesian", "Javanese", "Sundanese", "Balinese"].sort(),
      },
      {
        name: "Philippines",
        languages: ["Filipino", "Tagalog", "Cebuano", "Ilocano"].sort(),
      },
      {
        name: "Malaysia",
        languages: ["Malay", "Mandarin", "Tamil"].sort(),
      },
      {
        name: "Israel",
        languages: ["Hebrew", "Arabic"].sort(),
      },
      {
        name: "Saudi Arabia",
        languages: ["Arabic"].sort(),
      },
      {
        name: "Turkey",
        languages: ["Turkish"].sort(),
      },
    ],
  },
  {
    continent: "Europe",
    countries: [
      {
        name: "France",
        languages: ["French"].sort(),
      },
      {
        name: "Germany",
        languages: ["German"].sort(),
      },
      {
        name: "Spain",
        languages: ["Spanish", "Catalan", "Basque", "Galician"].sort(),
      },
      {
        name: "Italy",
        languages: ["Italian", "Sicilian", "Sardinian"].sort(),
      },
      {
        name: "United Kingdom",
        languages: ["English", "Welsh", "Scottish Gaelic", "Irish"].sort(),
      },
      {
        name: "Russia",
        languages: ["Russian"].sort(),
      },
      {
        name: "Ukraine",
        languages: ["Ukrainian", "Russian"].sort(),
      },
      {
        name: "Poland",
        languages: ["Polish"].sort(),
      },
      {
        name: "Netherlands",
        languages: ["Dutch", "Frisian"].sort(),
      },
      {
        name: "Sweden",
        languages: ["Swedish"].sort(),
      },
      {
        name: "Norway",
        languages: ["Norwegian"].sort(),
      },
      {
        name: "Finland",
        languages: ["Finnish", "Swedish"].sort(),
      },
      {
        name: "Denmark",
        languages: ["Danish"].sort(),
      },
      {
        name: "Greece",
        languages: ["Greek"].sort(),
      },
      {
        name: "Portugal",
        languages: ["Portuguese"].sort(),
      },
      {
        name: "Czech Republic",
        languages: ["Czech"].sort(),
      },
      {
        name: "Hungary",
        languages: ["Hungarian"].sort(),
      },
      {
        name: "Romania",
        languages: ["Romanian"].sort(),
      },
      {
        name: "Bulgaria",
        languages: ["Bulgarian"].sort(),
      },
      {
        name: "Serbia",
        languages: ["Serbian"].sort(),
      },
      {
        name: "Croatia",
        languages: ["Croatian"].sort(),
      },
    ],
  },
  {
    continent: "North America",
    countries: [
      {
        name: "United States",
        languages: [
          "English",
          "Spanish",
          "French",
          "Chinese",
          "Tagalog",
          "Vietnamese",
          "Korean",
          "Russian",
          "Arabic",
          "Haitian Creole",
          "Navajo",
        ].sort(),
      },
      {
        name: "Canada",
        languages: ["English", "French", "Inuktitut", "Cree"].sort(),
      },
      {
        name: "Mexico",
        languages: ["Spanish", "Nahuatl", "Maya", "Zapotec"].sort(),
      },
      {
        name: "Cuba",
        languages: ["Spanish"].sort(),
      },
      {
        name: "Haiti",
        languages: ["Haitian Creole", "French"].sort(),
      },
      {
        name: "Dominican Republic",
        languages: ["Spanish"].sort(),
      },
      {
        name: "Guatemala",
        languages: ["Spanish", "Quiché", "Kaqchikel", "Mam"].sort(),
      },
    ],
  },
  {
    continent: "South America",
    countries: [
      {
        name: "Brazil",
        languages: ["Portuguese"].sort(),
      },
      {
        name: "Argentina",
        languages: ["Spanish"].sort(),
      },
      {
        name: "Colombia",
        languages: ["Spanish"].sort(),
      },
      {
        name: "Peru",
        languages: ["Spanish", "Quechua", "Aymara"].sort(),
      },
      {
        name: "Chile",
        languages: ["Spanish", "Mapudungun"].sort(),
      },
      {
        name: "Venezuela",
        languages: ["Spanish"].sort(),
      },
      {
        name: "Ecuador",
        languages: ["Spanish", "Quechua"].sort(),
      },
      {
        name: "Bolivia",
        languages: ["Spanish", "Quechua", "Aymara", "Guarani"].sort(),
      },
    ],
  },
  {
    continent: "Oceania",
    countries: [
      {
        name: "Australia",
        languages: ["English", "Aboriginal languages"].sort(),
      },
      {
        name: "New Zealand",
        languages: ["English", "Māori"].sort(),
      },
      {
        name: "Papua New Guinea",
        languages: ["English", "Tok Pisin", "Hiri Motu"].sort(),
      },
      {
        name: "Fiji",
        languages: ["English", "Fijian", "Hindi"].sort(),
      },
      {
        name: "Solomon Islands",
        languages: ["English", "Solomon Islands Pijin"].sort(),
      },
    ],
  },
]

export default function LanguagesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedContinents, setExpandedContinents] = useState<string[]>(["Europe"]) // Default expanded continent

  const toggleContinent = (continent: string) => {
    setExpandedContinents((prev) =>
      prev.includes(continent) ? prev.filter((c) => c !== continent) : [...prev, continent],
    )
  }

  // Filter languages based on search term
  const filteredLanguageData = languageData
    .map((continent) => {
      const filteredCountries = continent.countries
        .map((country) => {
          const filteredLanguages = country.languages.filter((language) =>
            language.toLowerCase().includes(searchTerm.toLowerCase()),
          )
          return {
            ...country,
            languages: filteredLanguages,
          }
        })
        .filter((country) => country.languages.length > 0)

      return {
        ...continent,
        countries: filteredCountries,
      }
    })
    .filter((continent) => continent.countries.length > 0)

  // Count total languages
  const totalLanguages = new Set(
    languageData.flatMap((continent) => continent.countries.flatMap((country) => country.languages)),
  ).size

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 container px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">Our Global Language Network</h1>
            <p className="text-muted-foreground">
              Connect with native-speaking tutors in over {totalLanguages} languages from around the world
            </p>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for a language..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredLanguageData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No languages found matching your search.</p>
              <Button variant="outline" className="mt-4" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredLanguageData.map((continent) => (
                <Card key={continent.continent}>
                  <div>
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleContinent(continent.continent)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Globe className="h-5 w-5 mr-2 text-[#8B5A2B]" />
                          <CardTitle>{continent.continent}</CardTitle>
                        </div>
                        {expandedContinents.includes(continent.continent) ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                      <CardDescription>
                        {continent.countries.length} countries,{" "}
                        {continent.countries.reduce((acc, country) => acc + country.languages.length, 0)} languages
                      </CardDescription>
                    </CardHeader>

                    {expandedContinents.includes(continent.continent) && (
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          {continent.countries.map((country) => (
                            <div key={country.name} className="border rounded-md p-3">
                              <h3 className="font-medium mb-2">{country.name}</h3>
                              <div className="flex flex-wrap gap-1">
                                {country.languages.map((language) => (
                                  <Badge
                                    key={`${country.name}-${language}`}
                                    variant="outline"
                                    className="bg-[#8B5A2B]/10 hover:bg-[#8B5A2B]/20 cursor-pointer"
                                    onClick={() => {
                                      // In a real app, this would link to a search for this language
                                      window.location.href = `/dashboard/find-teachers?language=${language.toLowerCase()}`
                                    }}
                                  >
                                    {language}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to start learning?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="bg-[#8B5A2B] hover:bg-[#8B5A2B]/90"
                onClick={() => (window.location.href = "/dashboard/find-teachers")}
              >
                Find a Teacher
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/signup?role=student")}>
                Sign Up as a Student
              </Button>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t py-6 md:py-0 bg-[#8B5A2B] text-white">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 md:px-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="TOKI CONNECT Logo" width={30} height={30} />
            <p className="text-sm">© 2025 TOKI CONNECT. All rights reserved.</p>
          </div>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Terms
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Privacy
            </Link>
            <Link
              href="mailto:support@tokiconnect.com"
              className="text-sm font-medium hover:underline underline-offset-4"
            >
              Support
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
