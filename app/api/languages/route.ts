import { NextResponse } from "next/server"
import { languages, regions } from "@/components/language-selector"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get("region")
    const search = searchParams.get("search")
    
    let filteredLanguages = languages
    
    // Filter by region if specified
    if (region && region !== "all") {
      filteredLanguages = filteredLanguages.filter(lang => lang.region === region)
    }
    
    // Filter by search query if specified
    if (search) {
      const query = search.toLowerCase()
      filteredLanguages = filteredLanguages.filter(lang => 
        lang.label.toLowerCase().includes(query) ||
        lang.value.toLowerCase().includes(query) ||
        (lang.nativeName && lang.nativeName.toLowerCase().includes(query)) ||
        lang.region.toLowerCase().includes(query)
      )
    }
    
    // Convert the languages array to the format expected by the API
    const formattedLanguages = filteredLanguages.map((language, index) => ({
      id: index + 1,
      name: language.label,
      code: language.value,
      region: language.region,
      nativeName: language.nativeName,
    }))

    return NextResponse.json({
      languages: formattedLanguages,
      regions: regions,
      total: formattedLanguages.length,
    })
  } catch (error) {
    console.error("Error fetching languages:", error)
    return NextResponse.json({ error: "Failed to fetch languages" }, { status: 500 })
  }
}
