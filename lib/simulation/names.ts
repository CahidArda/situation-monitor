// ---------------------------------------------------------------------------
// Random name generator for CEOs, lawyers, analysts, and other characters
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  "James",
  "Margaret",
  "Björn",
  "Yuki",
  "Carlos",
  "Priya",
  "Olga",
  "Hans",
  "Amara",
  "Chen",
  "Sofia",
  "Ahmed",
  "Liam",
  "Fatima",
  "Viktor",
  "Isabella",
  "Kofi",
  "Mei",
  "Ayse",
  "Eduardo",
  "Astrid",
  "Raj",
  "Nadia",
  "Oscar",
  "Svetlana",
  "Kwame",
  "Ingrid",
  "Takeshi",
  "Adriana",
  "Henrik",
  "Zara",
];

const LAST_NAMES = [
  "Halvorsen",
  "Okonkwo",
  "Tanaka",
  "Rivera",
  "Patel",
  "Müller",
  "Kim",
  "van der Berg",
  "O'Brien",
  "Santos",
  "Johansson",
  "Nakamura",
  "Fischer",
  "Al-Rashid",
  "Petrov",
  "Lindström",
  "Gupta",
  "Moreau",
  "Castellano",
  "Okafor",
  "Bergström",
  "Sato",
  "McAllister",
  "Fernandez",
  "Ivanova",
  "de Vries",
  "Takahashi",
  "Eriksson",
  "Mensah",
  "Thornton",
  "Yilmaz",
];

/** Generate a random full name */
export function randomName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

/** Generate a random first name */
export function randomFirstName(): string {
  return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
}

/** Generate a random last name */
export function randomLastName(): string {
  return LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
}

/** Generate a title + name for analysts, officials, etc. */
export function randomTitledName(
  titles: string[] = ["Dr.", "Prof.", ""],
): string {
  const title = titles[Math.floor(Math.random() * titles.length)];
  const name = randomName();
  return title ? `${title} ${name}` : name;
}
