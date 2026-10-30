// Mock catalogue — frontend-only. Stands in for District's feed / search.

export const MOVIES = [
  { id: 'm1', name: 'Jailer 2', lang: 'Telugu', hyped: true },
  { id: 'm2', name: 'Pushpa 3: The Rampage', lang: 'Telugu', hyped: true },
  { id: 'm3', name: 'Kalki 2898 AD — Part 2', lang: 'Telugu', hyped: true },
  { id: 'm4', name: 'Devara: Part 2', lang: 'Telugu', hyped: false },
  { id: 'm5', name: 'Coolie', lang: 'Tamil', hyped: true },
  { id: 'm6', name: 'Dune: Part Three', lang: 'English', hyped: false },
  { id: 'm7', name: 'Avengers: Secret Wars', lang: 'English', hyped: true },
  { id: 'm8', name: 'Salaar: Part 2 — Shouryanga Parvam', lang: 'Telugu', hyped: false },
]

export const CITIES = ['Hyderabad', 'Bengaluru', 'Chennai', 'Mumbai', 'Pune', 'Delhi NCR']

export const THEATRES = {
  Hyderabad: [
    { code: 'CD43628', name: 'PVR Nexus Mall, Kukatpally' },
    { code: 'CD11902', name: 'AMB Cinemas, Gachibowli' },
    { code: 'CD55210', name: 'Asian Mukta A2, Miyapur' },
    { code: 'CD77841', name: 'INOX GVK One, Banjara Hills' },
  ],
  Bengaluru: [
    { code: 'CD30114', name: 'PVR Orion Mall, Rajajinagar' },
    { code: 'CD30220', name: 'INOX Garuda Mall, Magrath Rd' },
    { code: 'CD30456', name: 'Cinepolis Binnypet' },
  ],
  Chennai: [
    { code: 'CD20991', name: 'AGS Cinemas, OMR' },
    { code: 'CD20112', name: 'PVR Grand Mall, Velachery' },
  ],
  Mumbai: [
    { code: 'CD10001', name: 'PVR Icon, Lower Parel' },
    { code: 'CD10044', name: 'INOX R-City, Ghatkopar' },
  ],
  Pune: [{ code: 'CD40007', name: 'PVR Phoenix, Viman Nagar' }],
  'Delhi NCR': [
    { code: 'CD50003', name: 'PVR Select Citywalk, Saket' },
    { code: 'CD50071', name: 'INOX DLF Promenade, Vasant Kunj' },
  ],
}

export const TIME_BANDS = [
  { id: 'any', label: 'Any time' },
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'night', label: 'Night' },
]

// A couple of seed alerts so the dashboard isn't empty on first load.
export const SEED_ALERTS = [
  {
    id: 'a1',
    platform: 'district',
    movie_name: 'Pushpa 3: The Rampage',
    lang: 'Telugu',
    format: '2D',
    venue_code: 'CD43628',
    theatre: 'PVR Nexus Mall, Kukatpally',
    city: 'Hyderabad',
    date: '2026-11-07',
    time_band: 'evening',
    status: 'watching',
    created_at: Date.now() - 1000 * 60 * 42,
    last_checked_at: Date.now() - 1000 * 48,
    shows: [],
  },
  {
    id: 'a2',
    platform: 'district',
    movie_name: 'Jailer 2',
    lang: 'Telugu',
    format: '2D',
    venue_code: 'CD11902',
    theatre: 'AMB Cinemas, Gachibowli',
    city: 'Hyderabad',
    date: '2026-11-02',
    time_band: 'night',
    status: 'fired',
    created_at: Date.now() - 1000 * 60 * 60 * 5,
    last_checked_at: Date.now() - 1000 * 60 * 3,
    shows: [
      { time: '10:30 PM', classes: [{ name: 'PRIME', available: 164 }, { name: 'CROWN', available: 43 }] },
    ],
  },
]
