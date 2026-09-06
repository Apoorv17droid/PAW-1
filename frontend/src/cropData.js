export const CROP_ICONS = {
  wheat: "🌾",
  corn: "🌽",
  cloud: "☁️",
  reed: "🎋",
  peanut: "🥜",
  bean: "🫘",
  pea: "🫛",
  flower: "🌻",
  tomato: "🍅",
  onion: "🧅",
  pepper: "🌶️",
};

export const CROP_NAMES = {
  wheat: { en: "Wheat", hi: "गेहूं", mr: "गहू", gu: "ઘઉં", ta: "கோதுமை", te: "గోధుమ", pa: "ਕਣਕ", bn: "গম", kn: "ಗೋಧಿ" },
  rice: { en: "Rice", hi: "चावल", mr: "तांदूळ", gu: "ચોખા", ta: "அரிசி", te: "వరి", pa: "ਚੌਲ", bn: "ধান", kn: "ಅಕ್ಕಿ" },
  maize: { en: "Maize", hi: "मक्का", mr: "मका", gu: "મકાઈ", ta: "சோளம்", te: "మొక్కజొన్న", pa: "ਮੱਕੀ", bn: "ভুট্টা", kn: "ಜೋಳ" },
  cotton: { en: "Cotton", hi: "कपास", mr: "कापूस", gu: "કપાસ", ta: "பருத்தி", te: "పత్తి", pa: "ਕਪਾਹ", bn: "তুলা", kn: "ಹತ್ತಿ" },
  sugarcane: { en: "Sugarcane", hi: "गन्ना", mr: "ऊस", gu: "શેરડી", ta: "கரும்பு", te: "చెరకు", pa: "ਗੰਨਾ", bn: "আখ", kn: "ಕಬ್ಬು" },
  groundnut: { en: "Groundnut", hi: "मूंगफली", mr: "भुईमूग", gu: "મગફળી", ta: "நிலக்கடலை", te: "వేరుశనగ", pa: "ਮੂੰਗਫਲੀ", bn: "চীনাবাদাম", kn: "ಕಡಲೆಕಾಯಿ" },
  soybean: { en: "Soybean", hi: "सोयाबीन", mr: "सोयाबीन", gu: "સોયાબીન", ta: "சோயாபீன்", te: "సోయాబీన్", pa: "ਸੋਯਾਬੀਨ", bn: "সয়াবিন", kn: "ಸೋಯಾಬೀನ್" },
  chickpea: { en: "Chickpea", hi: "चना", mr: "हरभरा", gu: "ચણા", ta: "கொண்டைக்கடலை", te: "శనగలు", pa: "ਛੋਲੇ", bn: "ছোলা", kn: "ಕಡಲೆ" },
  mustard: { en: "Mustard", hi: "सरसों", mr: "मोहरी", gu: "રાઈ", ta: "கடுகு", te: "ఆవాలు", pa: "ਸਰੋਂ", bn: "সরিষা", kn: "ಸಾಸಿವೆ" },
  tomato: { en: "Tomato", hi: "टमाटर", mr: "टोमॅटो", gu: "ટામેટા", ta: "தக்காளி", te: "టమాటా", pa: "ਟਮਾਟਰ", bn: "টমেটো", kn: "ಟೊಮ್ಯಾಟೊ" },
  onion: { en: "Onion", hi: "प्याज", mr: "कांदा", gu: "ડુંગળી", ta: "வெங்காயம்", te: "ఉల్లిపాయ", pa: "ਪਿਆਜ਼", bn: "পেঁয়াজ", kn: "ಈರುಳ್ಳಿ" },
  chili: { en: "Chili", hi: "मिर्च", mr: "मिरची", gu: "મરચાં", ta: "மிளகாய்", te: "మిర్చి", pa: "ਮਿਰਚ", bn: "মরিচ", kn: "ಮೆಣಸಿನಕಾಯಿ" },
};

export function cropName(cropId, lang) {
  const row = CROP_NAMES[cropId];
  if (!row) return cropId;
  return row[lang] || row.en;
}
