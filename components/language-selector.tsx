"use client"
import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Language interface with region for grouping
export interface Language {
  value: string
  label: string
  region: string
  nativeName?: string
}

// Comprehensive language list with native languages from all continents
export const languages: Language[] = [
  // ==================== AFRICAN LANGUAGES ====================
  // West Africa
  { value: "yoruba", label: "Yoruba", region: "Africa", nativeName: "Èdè Yorùbá" },
  { value: "igbo", label: "Igbo", region: "Africa", nativeName: "Asụsụ Igbo" },
  { value: "hausa", label: "Hausa", region: "Africa", nativeName: "Harshen Hausa" },
  { value: "akan", label: "Akan (Twi)", region: "Africa", nativeName: "Akan" },
  { value: "ewe", label: "Ewe", region: "Africa", nativeName: "Eʋegbe" },
  { value: "ga", label: "Ga", region: "Africa", nativeName: "Gã" },
  { value: "wolof", label: "Wolof", region: "Africa", nativeName: "Wolof" },
  { value: "fulani", label: "Fulani (Fula)", region: "Africa", nativeName: "Fulfulde" },
  { value: "bambara", label: "Bambara", region: "Africa", nativeName: "Bamanankan" },
  { value: "mandinka", label: "Mandinka", region: "Africa", nativeName: "Mandinka" },
  { value: "soninke", label: "Soninke", region: "Africa", nativeName: "Sooninkanxanne" },
  { value: "serer", label: "Serer", region: "Africa", nativeName: "Seereer" },
  { value: "temne", label: "Temne", region: "Africa", nativeName: "Temne" },
  { value: "krio", label: "Krio", region: "Africa", nativeName: "Krio" },
  { value: "moore", label: "Mossi (Mooré)", region: "Africa", nativeName: "Mooré" },
  { value: "fon", label: "Fon", region: "Africa", nativeName: "Fɔ̀ngbè" },
  { value: "edo", label: "Edo (Bini)", region: "Africa", nativeName: "Ẹ̀dó" },
  { value: "ibibio", label: "Ibibio", region: "Africa", nativeName: "Ibibio" },
  { value: "efik", label: "Efik", region: "Africa", nativeName: "Efik" },
  { value: "tiv", label: "Tiv", region: "Africa", nativeName: "Tiv" },
  { value: "nupe", label: "Nupe", region: "Africa", nativeName: "Nupe" },
  { value: "kanuri", label: "Kanuri", region: "Africa", nativeName: "Kanuri" },
  
  // East Africa
  { value: "swahili", label: "Swahili", region: "Africa", nativeName: "Kiswahili" },
  { value: "amharic", label: "Amharic", region: "Africa", nativeName: "አማርኛ" },
  { value: "oromo", label: "Oromo", region: "Africa", nativeName: "Afaan Oromoo" },
  { value: "tigrinya", label: "Tigrinya", region: "Africa", nativeName: "ትግርኛ" },
  { value: "somali", label: "Somali", region: "Africa", nativeName: "Soomaali" },
  { value: "luganda", label: "Luganda", region: "Africa", nativeName: "Oluganda" },
  { value: "kikuyu", label: "Kikuyu", region: "Africa", nativeName: "Gĩkũyũ" },
  { value: "luo", label: "Luo (Dholuo)", region: "Africa", nativeName: "Dholuo" },
  { value: "kamba", label: "Kamba", region: "Africa", nativeName: "Kikamba" },
  { value: "luhya", label: "Luhya", region: "Africa", nativeName: "Oluluyia" },
  { value: "kalenjin", label: "Kalenjin", region: "Africa", nativeName: "Kalenjin" },
  { value: "maasai", label: "Maasai", region: "Africa", nativeName: "ɔl Maa" },
  { value: "kinyarwanda", label: "Kinyarwanda", region: "Africa", nativeName: "Ikinyarwanda" },
  { value: "kirundi", label: "Kirundi", region: "Africa", nativeName: "Ikirundi" },
  { value: "gikuyu", label: "Gikuyu", region: "Africa", nativeName: "Gĩkũyũ" },
  
  // Southern Africa
  { value: "zulu", label: "Zulu", region: "Africa", nativeName: "isiZulu" },
  { value: "xhosa", label: "Xhosa", region: "Africa", nativeName: "isiXhosa" },
  { value: "afrikaans", label: "Afrikaans", region: "Africa", nativeName: "Afrikaans" },
  { value: "sotho", label: "Sotho", region: "Africa", nativeName: "Sesotho" },
  { value: "tswana", label: "Tswana", region: "Africa", nativeName: "Setswana" },
  { value: "shona", label: "Shona", region: "Africa", nativeName: "chiShona" },
  { value: "ndebele", label: "Ndebele", region: "Africa", nativeName: "isiNdebele" },
  { value: "venda", label: "Venda", region: "Africa", nativeName: "Tshivenḓa" },
  { value: "tsonga", label: "Tsonga", region: "Africa", nativeName: "Xitsonga" },
  { value: "swazi", label: "Swazi", region: "Africa", nativeName: "siSwati" },
  { value: "nyanja", label: "Nyanja (Chewa)", region: "Africa", nativeName: "Chichewa" },
  { value: "tumbuka", label: "Tumbuka", region: "Africa", nativeName: "chiTumbuka" },
  { value: "bemba", label: "Bemba", region: "Africa", nativeName: "ChiBemba" },
  { value: "lozi", label: "Lozi", region: "Africa", nativeName: "siLozi" },
  { value: "herero", label: "Herero", region: "Africa", nativeName: "Otjiherero" },
  { value: "ovambo", label: "Ovambo", region: "Africa", nativeName: "Oshiwambo" },
  { value: "san", label: "San (Khoisan)", region: "Africa", nativeName: "Khoisan" },
  
  // Central Africa
  { value: "kongo", label: "Kongo", region: "Africa", nativeName: "Kikongo" },
  { value: "lingala", label: "Lingala", region: "Africa", nativeName: "Lingála" },
  { value: "tshiluba", label: "Tshiluba", region: "Africa", nativeName: "Tshiluba" },
  { value: "sango", label: "Sango", region: "Africa", nativeName: "Sängö" },
  { value: "fang", label: "Fang", region: "Africa", nativeName: "Fang" },
  { value: "bulu", label: "Bulu", region: "Africa", nativeName: "Bulu" },
  { value: "ewondo", label: "Ewondo", region: "Africa", nativeName: "Ewondo" },
  { value: "douala", label: "Douala", region: "Africa", nativeName: "Duala" },
  
  // North Africa
  { value: "arabic", label: "Arabic", region: "Africa", nativeName: "العربية" },
  { value: "berber", label: "Berber (Tamazight)", region: "Africa", nativeName: "ⵜⴰⵎⴰⵣⵉⵖⵜ" },
  { value: "kabyle", label: "Kabyle", region: "Africa", nativeName: "Taqbaylit" },
  { value: "tuareg", label: "Tuareg (Tamashek)", region: "Africa", nativeName: "Tamashek" },
  { value: "hassaniya", label: "Hassaniya Arabic", region: "Africa", nativeName: "حسانية" },
  
  // Island
  { value: "malagasy", label: "Malagasy", region: "Africa", nativeName: "Malagasy" },
  
  // ==================== ASIAN LANGUAGES ====================
  // East Asia
  { value: "mandarin", label: "Mandarin Chinese", region: "Asia", nativeName: "普通话" },
  { value: "cantonese", label: "Cantonese", region: "Asia", nativeName: "廣東話" },
  { value: "wu", label: "Wu (Shanghainese)", region: "Asia", nativeName: "吴语" },
  { value: "min", label: "Min (Hokkien)", region: "Asia", nativeName: "閩南語" },
  { value: "hakka", label: "Hakka", region: "Asia", nativeName: "客家話" },
  { value: "taiwanese", label: "Taiwanese Hokkien", region: "Asia", nativeName: "臺灣話" },
  { value: "japanese", label: "Japanese", region: "Asia", nativeName: "日本語" },
  { value: "korean", label: "Korean", region: "Asia", nativeName: "한국어" },
  { value: "mongolian", label: "Mongolian", region: "Asia", nativeName: "Монгол хэл" },
  { value: "tibetan", label: "Tibetan", region: "Asia", nativeName: "བོད་སྐད" },
  
  // South Asia
  { value: "hindi", label: "Hindi", region: "Asia", nativeName: "हिन्दी" },
  { value: "bengali", label: "Bengali", region: "Asia", nativeName: "বাংলা" },
  { value: "telugu", label: "Telugu", region: "Asia", nativeName: "తెలుగు" },
  { value: "marathi", label: "Marathi", region: "Asia", nativeName: "मराठी" },
  { value: "tamil", label: "Tamil", region: "Asia", nativeName: "தமிழ்" },
  { value: "urdu", label: "Urdu", region: "Asia", nativeName: "اردو" },
  { value: "gujarati", label: "Gujarati", region: "Asia", nativeName: "ગુજરાતી" },
  { value: "kannada", label: "Kannada", region: "Asia", nativeName: "ಕನ್ನಡ" },
  { value: "malayalam", label: "Malayalam", region: "Asia", nativeName: "മലയാളം" },
  { value: "punjabi", label: "Punjabi", region: "Asia", nativeName: "ਪੰਜਾਬੀ" },
  { value: "odia", label: "Odia (Oriya)", region: "Asia", nativeName: "ଓଡ଼ିଆ" },
  { value: "assamese", label: "Assamese", region: "Asia", nativeName: "অসমীয়া" },
  { value: "maithili", label: "Maithili", region: "Asia", nativeName: "मैथिली" },
  { value: "santali", label: "Santali", region: "Asia", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ" },
  { value: "kashmiri", label: "Kashmiri", region: "Asia", nativeName: "کٲشُر" },
  { value: "konkani", label: "Konkani", region: "Asia", nativeName: "कोंकणी" },
  { value: "dogri", label: "Dogri", region: "Asia", nativeName: "डोगरी" },
  { value: "nepali", label: "Nepali", region: "Asia", nativeName: "नेपाली" },
  { value: "sinhalese", label: "Sinhalese", region: "Asia", nativeName: "සිංහල" },
  { value: "dhivehi", label: "Dhivehi", region: "Asia", nativeName: "ދިވެހި" },
  { value: "pashto", label: "Pashto", region: "Asia", nativeName: "پښتو" },
  { value: "dari", label: "Dari", region: "Asia", nativeName: "دری" },
  { value: "balochi", label: "Balochi", region: "Asia", nativeName: "بلوچی" },
  { value: "sindhi", label: "Sindhi", region: "Asia", nativeName: "سنڌي" },
  
  // Southeast Asia
  { value: "vietnamese", label: "Vietnamese", region: "Asia", nativeName: "Tiếng Việt" },
  { value: "thai", label: "Thai", region: "Asia", nativeName: "ภาษาไทย" },
  { value: "indonesian", label: "Indonesian", region: "Asia", nativeName: "Bahasa Indonesia" },
  { value: "javanese", label: "Javanese", region: "Asia", nativeName: "Basa Jawa" },
  { value: "sundanese", label: "Sundanese", region: "Asia", nativeName: "Basa Sunda" },
  { value: "balinese", label: "Balinese", region: "Asia", nativeName: "Basa Bali" },
  { value: "madurese", label: "Madurese", region: "Asia", nativeName: "Madhura" },
  { value: "minangkabau", label: "Minangkabau", region: "Asia", nativeName: "Baso Minangkabau" },
  { value: "acehnese", label: "Acehnese", region: "Asia", nativeName: "Bahsa Acèh" },
  { value: "bugis", label: "Bugis", region: "Asia", nativeName: "Basa Ugi" },
  { value: "filipino", label: "Filipino", region: "Asia", nativeName: "Filipino" },
  { value: "tagalog", label: "Tagalog", region: "Asia", nativeName: "Tagalog" },
  { value: "cebuano", label: "Cebuano", region: "Asia", nativeName: "Sinugboanon" },
  { value: "ilocano", label: "Ilocano", region: "Asia", nativeName: "Ilokano" },
  { value: "hiligaynon", label: "Hiligaynon", region: "Asia", nativeName: "Ilonggo" },
  { value: "bicolano", label: "Bicolano", region: "Asia", nativeName: "Bikol" },
  { value: "waray", label: "Waray", region: "Asia", nativeName: "Winaray" },
  { value: "pangasinan", label: "Pangasinan", region: "Asia", nativeName: "Pangasinan" },
  { value: "kapampangan", label: "Kapampangan", region: "Asia", nativeName: "Kapampangan" },
  { value: "malay", label: "Malay", region: "Asia", nativeName: "Bahasa Melayu" },
  { value: "khmer", label: "Khmer", region: "Asia", nativeName: "ភាសាខ្មែរ" },
  { value: "lao", label: "Lao", region: "Asia", nativeName: "ພາສາລາວ" },
  { value: "burmese", label: "Burmese", region: "Asia", nativeName: "မြန်မာစာ" },
  { value: "karen", label: "Karen", region: "Asia", nativeName: "ကညီ" },
  { value: "shan", label: "Shan", region: "Asia", nativeName: "ၽႃႇသႃႇတႆး" },
  
  // Central Asia
  { value: "kazakh", label: "Kazakh", region: "Asia", nativeName: "Қазақ тілі" },
  { value: "uzbek", label: "Uzbek", region: "Asia", nativeName: "Oʻzbek tili" },
  { value: "uyghur", label: "Uyghur", region: "Asia", nativeName: "ئۇيغۇرچە" },
  { value: "kyrgyz", label: "Kyrgyz", region: "Asia", nativeName: "Кыргызча" },
  { value: "tajik", label: "Tajik", region: "Asia", nativeName: "Тоҷикӣ" },
  { value: "turkmen", label: "Turkmen", region: "Asia", nativeName: "Türkmençe" },
  
  // Middle East
  { value: "persian", label: "Persian (Farsi)", region: "Asia", nativeName: "فارسی" },
  { value: "turkish", label: "Turkish", region: "Asia", nativeName: "Türkçe" },
  { value: "hebrew", label: "Hebrew", region: "Asia", nativeName: "עברית" },
  { value: "kurdish", label: "Kurdish", region: "Asia", nativeName: "Kurdî" },
  { value: "azerbaijani", label: "Azerbaijani", region: "Asia", nativeName: "Azərbaycan dili" },
  { value: "armenian", label: "Armenian", region: "Asia", nativeName: "Հայերdelays" },
  { value: "georgian", label: "Georgian", region: "Asia", nativeName: "ქართული" },
  
  // ==================== EUROPEAN LANGUAGES ====================
  // Germanic Languages
  { value: "english", label: "English", region: "Europe", nativeName: "English" },
  { value: "german", label: "German", region: "Europe", nativeName: "Deutsch" },
  { value: "dutch", label: "Dutch", region: "Europe", nativeName: "Nederlands" },
  { value: "swedish", label: "Swedish", region: "Europe", nativeName: "Svenska" },
  { value: "norwegian", label: "Norwegian", region: "Europe", nativeName: "Norsk" },
  { value: "danish", label: "Danish", region: "Europe", nativeName: "Dansk" },
  { value: "icelandic", label: "Icelandic", region: "Europe", nativeName: "Íslenska" },
  { value: "faroese", label: "Faroese", region: "Europe", nativeName: "Føroyskt" },
  { value: "frisian", label: "Frisian", region: "Europe", nativeName: "Frysk" },
  { value: "yiddish", label: "Yiddish", region: "Europe", nativeName: "ייִדיש" },
  { value: "luxembourgish", label: "Luxembourgish", region: "Europe", nativeName: "Lëtzebuergesch" },
  { value: "swiss_german", label: "Swiss German", region: "Europe", nativeName: "Schwyzerdütsch" },
  { value: "low_german", label: "Low German", region: "Europe", nativeName: "Plattdüütsch" },
  
  // Romance Languages
  { value: "french", label: "French", region: "Europe", nativeName: "Français" },
  { value: "spanish", label: "Spanish", region: "Europe", nativeName: "Español" },
  { value: "portuguese", label: "Portuguese", region: "Europe", nativeName: "Português" },
  { value: "italian", label: "Italian", region: "Europe", nativeName: "Italiano" },
  { value: "romanian", label: "Romanian", region: "Europe", nativeName: "Română" },
  { value: "catalan", label: "Catalan", region: "Europe", nativeName: "Català" },
  { value: "galician", label: "Galician", region: "Europe", nativeName: "Galego" },
  { value: "occitan", label: "Occitan", region: "Europe", nativeName: "Occitan" },
  { value: "sicilian", label: "Sicilian", region: "Europe", nativeName: "Sicilianu" },
  { value: "sardinian", label: "Sardinian", region: "Europe", nativeName: "Sardu" },
  { value: "corsican", label: "Corsican", region: "Europe", nativeName: "Corsu" },
  { value: "friulian", label: "Friulian", region: "Europe", nativeName: "Furlan" },
  { value: "romansh", label: "Romansh", region: "Europe", nativeName: "Rumantsch" },
  { value: "aragonese", label: "Aragonese", region: "Europe", nativeName: "Aragonés" },
  { value: "asturian", label: "Asturian", region: "Europe", nativeName: "Asturianu" },
  
  // Slavic Languages
  { value: "russian", label: "Russian", region: "Europe", nativeName: "Русский" },
  { value: "ukrainian", label: "Ukrainian", region: "Europe", nativeName: "Українська" },
  { value: "polish", label: "Polish", region: "Europe", nativeName: "Polski" },
  { value: "czech", label: "Czech", region: "Europe", nativeName: "Čeština" },
  { value: "slovak", label: "Slovak", region: "Europe", nativeName: "Slovenčina" },
  { value: "bulgarian", label: "Bulgarian", region: "Europe", nativeName: "Български" },
  { value: "serbian", label: "Serbian", region: "Europe", nativeName: "Српски" },
  { value: "croatian", label: "Croatian", region: "Europe", nativeName: "Hrvatski" },
  { value: "slovenian", label: "Slovenian", region: "Europe", nativeName: "Slovenščina" },
  { value: "macedonian", label: "Macedonian", region: "Europe", nativeName: "Македонски" },
  { value: "bosnian", label: "Bosnian", region: "Europe", nativeName: "Bosanski" },
  { value: "belarusian", label: "Belarusian", region: "Europe", nativeName: "Беларуская" },
  { value: "rusyn", label: "Rusyn", region: "Europe", nativeName: "Русиньскый" },
  { value: "sorbian", label: "Sorbian", region: "Europe", nativeName: "Serbšćina" },
  
  // Celtic Languages
  { value: "irish", label: "Irish (Gaeilge)", region: "Europe", nativeName: "Gaeilge" },
  { value: "scottish_gaelic", label: "Scottish Gaelic", region: "Europe", nativeName: "Gàidhlig" },
  { value: "welsh", label: "Welsh", region: "Europe", nativeName: "Cymraeg" },
  { value: "breton", label: "Breton", region: "Europe", nativeName: "Brezhoneg" },
  { value: "cornish", label: "Cornish", region: "Europe", nativeName: "Kernewek" },
  { value: "manx", label: "Manx", region: "Europe", nativeName: "Gaelg" },
  
  // Baltic Languages
  { value: "lithuanian", label: "Lithuanian", region: "Europe", nativeName: "Lietuvių" },
  { value: "latvian", label: "Latvian", region: "Europe", nativeName: "Latviešu" },
  
  // Uralic Languages
  { value: "finnish", label: "Finnish", region: "Europe", nativeName: "Suomi" },
  { value: "estonian", label: "Estonian", region: "Europe", nativeName: "Eesti" },
  { value: "hungarian", label: "Hungarian", region: "Europe", nativeName: "Magyar" },
  { value: "sami", label: "Sami", region: "Europe", nativeName: "Sámegiella" },
  
  // Other European Languages
  { value: "greek", label: "Greek", region: "Europe", nativeName: "Ελληνικά" },
  { value: "albanian", label: "Albanian", region: "Europe", nativeName: "Shqip" },
  { value: "basque", label: "Basque", region: "Europe", nativeName: "Euskara" },
  { value: "maltese", label: "Maltese", region: "Europe", nativeName: "Malti" },
  
  // ==================== NORTH AMERICAN LANGUAGES ====================
  // Mesoamerican Languages
  { value: "nahuatl", label: "Nahuatl (Aztec)", region: "North America", nativeName: "Nāhuatl" },
  { value: "maya", label: "Maya", region: "North America", nativeName: "Maaya" },
  { value: "yucatec", label: "Yucatec Maya", region: "North America", nativeName: "Màaya t'àan" },
  { value: "quiche", label: "K'iche'", region: "North America", nativeName: "K'iche'" },
  { value: "kaqchikel", label: "Kaqchikel", region: "North America", nativeName: "Kaqchikel" },
  { value: "mam", label: "Mam", region: "North America", nativeName: "Qyool Mam" },
  { value: "zapotec", label: "Zapotec", region: "North America", nativeName: "Diidxazá" },
  { value: "mixtec", label: "Mixtec", region: "North America", nativeName: "Tu'un savi" },
  { value: "otomi", label: "Otomi", region: "North America", nativeName: "Hñähñu" },
  { value: "totonac", label: "Totonac", region: "North America", nativeName: "Totonaco" },
  { value: "mazatec", label: "Mazatec", region: "North America", nativeName: "Ha shuta enima" },
  { value: "purepecha", label: "Purépecha", region: "North America", nativeName: "P'urhépecha" },
  { value: "huastec", label: "Huastec", region: "North America", nativeName: "Téenek" },
  
  // North American Indigenous Languages
  { value: "navajo", label: "Navajo (Diné)", region: "North America", nativeName: "Diné bizaad" },
  { value: "cherokee", label: "Cherokee", region: "North America", nativeName: "ᏣᎳᎩ ᎦᏬᏂᎯᏍᏗ" },
  { value: "ojibwe", label: "Ojibwe (Chippewa)", region: "North America", nativeName: "Anishinaabemowin" },
  { value: "cree", label: "Cree", region: "North America", nativeName: "ᓀᐦᐃᔭᐍᐏᐣ" },
  { value: "dakota", label: "Dakota (Sioux)", region: "North America", nativeName: "Dakhótiyapi" },
  { value: "lakota", label: "Lakota", region: "North America", nativeName: "Lakȟótiyapi" },
  { value: "apache", label: "Apache", region: "North America", nativeName: "Ndé bizaa" },
  { value: "mohawk", label: "Mohawk", region: "North America", nativeName: "Kanyen'kéha" },
  { value: "inuktitut", label: "Inuktitut", region: "North America", nativeName: "ᐃᓄᒃᑎᑐᑦ" },
  { value: "inupiaq", label: "Iñupiaq", region: "North America", nativeName: "Iñupiaq" },
  { value: "yupik", label: "Yupik", region: "North America", nativeName: "Yupigestun" },
  { value: "tlingit", label: "Tlingit", region: "North America", nativeName: "Lingít" },
  { value: "haida", label: "Haida", region: "North America", nativeName: "X̱aat Kíl" },
  { value: "blackfoot", label: "Blackfoot", region: "North America", nativeName: "Siksiká" },
  { value: "choctaw", label: "Choctaw", region: "North America", nativeName: "Chahta" },
  { value: "chickasaw", label: "Chickasaw", region: "North America", nativeName: "Chikashshanompa'" },
  { value: "muscogee", label: "Muscogee (Creek)", region: "North America", nativeName: "Mvskoke" },
  { value: "seminole", label: "Seminole", region: "North America", nativeName: "Seminole" },
  { value: "hopi", label: "Hopi", region: "North America", nativeName: "Hopilàvayi" },
  { value: "zuni", label: "Zuni", region: "North America", nativeName: "Shiwi'ma" },
  { value: "comanche", label: "Comanche", region: "North America", nativeName: "Nʉmʉ Tekwapʉ" },
  { value: "shoshone", label: "Shoshone", region: "North America", nativeName: "Shoshoni" },
  
  // Caribbean Creoles
  { value: "haitian_creole", label: "Haitian Creole", region: "North America", nativeName: "Kreyòl ayisyen" },
  { value: "jamaican_patois", label: "Jamaican Patois", region: "North America", nativeName: "Patwa" },
  
  // ==================== SOUTH AMERICAN LANGUAGES ====================
  // Andean Languages
  { value: "quechua", label: "Quechua", region: "South America", nativeName: "Runasimi" },
  { value: "aymara", label: "Aymara", region: "South America", nativeName: "Aymar aru" },
  { value: "kichwa", label: "Kichwa", region: "South America", nativeName: "Kichwa" },
  
  // Tupi-Guarani Languages
  { value: "guarani", label: "Guaraní", region: "South America", nativeName: "Avañe'ẽ" },
  { value: "tupi", label: "Tupi", region: "South America", nativeName: "Tupinambá" },
  { value: "nheengatu", label: "Nheengatu", region: "South America", nativeName: "Nheengatu" },
  
  // Other South American Languages
  { value: "mapudungun", label: "Mapudungun", region: "South America", nativeName: "Mapudungun" },
  { value: "wayuu", label: "Wayuu", region: "South America", nativeName: "Wayuunaiki" },
  { value: "arawak", label: "Arawak", region: "South America", nativeName: "Lokono" },
  { value: "yanomami", label: "Yanomami", region: "South America", nativeName: "Yanomamö" },
  { value: "embera", label: "Emberá", region: "South America", nativeName: "Emberá" },
  { value: "shipibo", label: "Shipibo", region: "South America", nativeName: "Shipibo-Conibo" },
  { value: "shuar", label: "Shuar", region: "South America", nativeName: "Shuar chicham" },
  { value: "ticuna", label: "Ticuna", region: "South America", nativeName: "Tikuna" },
  { value: "wichi", label: "Wichí", region: "South America", nativeName: "Wichi lhamtes" },
  { value: "toba", label: "Toba (Qom)", region: "South America", nativeName: "Qom" },
  { value: "guambiano", label: "Guambiano", region: "South America", nativeName: "Namtrik" },
  { value: "nasa", label: "Nasa (Páez)", region: "South America", nativeName: "Nasa Yuwe" },
  { value: "kogi", label: "Kogi", region: "South America", nativeName: "Kággaba" },
  { value: "bribri", label: "Bribri", region: "South America", nativeName: "Bribri" },
  
  // ==================== OCEANIAN LANGUAGES ====================
  // Polynesian Languages
  { value: "hawaiian", label: "Hawaiian", region: "Oceania", nativeName: "ʻŌlelo Hawaiʻi" },
  { value: "samoan", label: "Samoan", region: "Oceania", nativeName: "Gagana Samoa" },
  { value: "tongan", label: "Tongan", region: "Oceania", nativeName: "Lea faka-Tonga" },
  { value: "maori", label: "Māori", region: "Oceania", nativeName: "Te Reo Māori" },
  { value: "tahitian", label: "Tahitian", region: "Oceania", nativeName: "Reo Tahiti" },
  { value: "rarotongan", label: "Rarotongan", region: "Oceania", nativeName: "Te reo Māori Kūki 'Āirani" },
  { value: "tuvaluan", label: "Tuvaluan", region: "Oceania", nativeName: "Te Ggana Tuuvalu" },
  { value: "niuean", label: "Niuean", region: "Oceania", nativeName: "Ko e vagahau Niuē" },
  { value: "tokelauan", label: "Tokelauan", region: "Oceania", nativeName: "Te Gagana Tokelau" },
  
  // Melanesian Languages
  { value: "fijian", label: "Fijian", region: "Oceania", nativeName: "Na Vosa Vakaviti" },
  { value: "tok_pisin", label: "Tok Pisin", region: "Oceania", nativeName: "Tok Pisin" },
  { value: "hiri_motu", label: "Hiri Motu", region: "Oceania", nativeName: "Hiri Motu" },
  { value: "solomon_islands_pijin", label: "Solomon Islands Pijin", region: "Oceania", nativeName: "Pijin" },
  { value: "bislama", label: "Bislama", region: "Oceania", nativeName: "Bislama" },
  
  // Micronesian Languages
  { value: "marshallese", label: "Marshallese", region: "Oceania", nativeName: "Kajin M̧ajeļ" },
  { value: "palauan", label: "Palauan", region: "Oceania", nativeName: "A tekoi er a Belau" },
  { value: "chamorro", label: "Chamorro", region: "Oceania", nativeName: "Fino' Chamoru" },
  { value: "chuukese", label: "Chuukese", region: "Oceania", nativeName: "Chuuk" },
  { value: "pohnpeian", label: "Pohnpeian", region: "Oceania", nativeName: "Pohnpei" },
  { value: "kosraean", label: "Kosraean", region: "Oceania", nativeName: "Kosrae" },
  { value: "yapese", label: "Yapese", region: "Oceania", nativeName: "Yap" },
  { value: "nauruan", label: "Nauruan", region: "Oceania", nativeName: "Dorerin Naoero" },
  { value: "kiribati", label: "Kiribati (Gilbertese)", region: "Oceania", nativeName: "Te taetae ni Kiribati" },
  
  // Australian Languages
  { value: "warlpiri", label: "Warlpiri", region: "Oceania", nativeName: "Warlpiri" },
  { value: "pitjantjatjara", label: "Pitjantjatjara", region: "Oceania", nativeName: "Pitjantjatjara" },
  { value: "arrernte", label: "Arrernte", region: "Oceania", nativeName: "Arrernte" },
  { value: "yolngu", label: "Yolngu Matha", region: "Oceania", nativeName: "Yolŋu Matha" },
  { value: "kriol", label: "Australian Kriol", region: "Oceania", nativeName: "Kriol" },
  { value: "torres_strait", label: "Torres Strait Creole", region: "Oceania", nativeName: "Yumplatok" },
  { value: "kala_lagaw_ya", label: "Kala Lagaw Ya", region: "Oceania", nativeName: "Kala Lagaw Ya" },
  
  // ==================== SIGN LANGUAGES ====================
  { value: "asl", label: "American Sign Language", region: "Sign Languages", nativeName: "ASL" },
  { value: "bsl", label: "British Sign Language", region: "Sign Languages", nativeName: "BSL" },
  { value: "lsf", label: "French Sign Language", region: "Sign Languages", nativeName: "LSF" },
  { value: "dgs", label: "German Sign Language", region: "Sign Languages", nativeName: "DGS" },
  { value: "auslan", label: "Australian Sign Language", region: "Sign Languages", nativeName: "Auslan" },
  { value: "jsl", label: "Japanese Sign Language", region: "Sign Languages", nativeName: "日本手話" },
  { value: "csl", label: "Chinese Sign Language", region: "Sign Languages", nativeName: "中国手语" },
  { value: "isl", label: "International Sign", region: "Sign Languages", nativeName: "IS" },
  
].sort((a, b) => a.label.localeCompare(b.label))

// Get unique regions for grouping
export const regions = [...new Set(languages.map(l => l.region))].sort()

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
