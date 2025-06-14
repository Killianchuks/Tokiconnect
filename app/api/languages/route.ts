import { NextResponse } from "next/server"
import { languages } from "@/components/language-selector"

export async function GET() {
  try {
    // Convert the languages array to the format expected by the API
    const formattedLanguages = languages.map((language, index) => ({
      id: index + 1,
      name: language.label,
      code: language.value,
      native_speakers: Math.floor(Math.random() * 500) + 1, // Random number for demo purposes
      countries: [],
    }))

    return NextResponse.json(formattedLanguages)
  } catch (error) {
    console.error("Error fetching languages:", error)
    return NextResponse.json({ error: "Failed to fetch languages" }, { status: 500 })
  }
}
