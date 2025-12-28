# **App Name**: RoadCash

## Core Features:

- User Authentication: Login page with authentication against the API (https://road-cash.onrender.com/auth/sign-in), storing UserId and token upon successful login.
- Dashboard: Dashboard page displaying a summary of finances for a selected week (Monday to Sunday).
- Financial Summary: Detailed financial information on dashboard including: Net earnings, expenses, and distance traveled for selected week, fetched from API (https://road-cash.onrender.com/entries/resume?userId=${userId}&type=week&from=${initialDate}&to=${finalDate}).
- Entries Table: Entries page with a filterable table of entries for a selected week, fetched from API (https://road-cash.onrender.com/get/entries/${userId}).
- Add Entry Form: Form to add a new entry with fields for date, initial km, final km, food expense, other expenses, and gross gain; posting to API (https://road-cash.onrender.com/entry/create).
- Entry Actions: Edit and delete buttons on each table entry to modify or remove entries via API (https://road-cash.onrender.com/entry/delete/${userId}/${entryId} and https://road-cash.onrender.com/entry/update/${userId}/${entryId}).
- Settings Page: Settings page to configure cost per km for various vehicle maintenance items (óleo, relacão, pneu dianteiro, pneu traseiro, gasolina) with fields for lifespan and price.

## Style Guidelines:

- Primary color: A vibrant blue (#29ABE2) to evoke feelings of trust and reliability in financial matters.
- Background color: Light gray (#F0F2F5), almost white but not quite, for a clean, modern backdrop.
- Accent color: Green (#2ECC71) for positive values (like gains), providing clear visual cues. The accent color should be significantly different from the primary in both brightness and saturation to create good contrast.
- Body font: 'Inter', a sans-serif with a modern, objective, neutral look; suitable for body text. Headline font: 'Space Grotesk', a sans-serif with a techy, scientific feel; suitable for headlines.
- Use simple, modern icons for navigation and actions.
- Clean, organized layout with a focus on data clarity.
- Subtle transitions and animations for a smooth user experience.