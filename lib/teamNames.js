const SHORT_NAMES = {
  "Bosnien-Herzegowina": "Bosnien-Herz.",
  "Bosnia and Herzegovina": "Bosnien-Herz.",
  "Bosnien und Herzegowina": "Bosnien-Herz.",
  "Nordmazedonien": "N. Mazedonien",
  "Tschechische Republik": "Tschechien",
  "Vereinigte Arabische Emirate": "V.A. Emirate",
  "Vereinigte Staaten": "USA",
};

export function shortName(name) {
  if (!name) return name;
  return SHORT_NAMES[name] ?? name;
}
