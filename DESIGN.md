Project Design Freeze
=====================

The project UI for the Student Dropout Prediction dashboard is intended to keep the current "Admin" design and layout across roles (teacher and administrator). Do not modify the overall look-and-feel without agreement from the owner.

Core files to preserve
- `src/app/layout.tsx` - root layout and global structure
- `src/app/globals.css` - global styles and Tailwind base
- `src/app/teacher/_components/teacher-dashboard.tsx` - teacher UI
- `src/app/administrator/_components/administrator-dashboard.tsx` - admin UI
- `src/app/page.tsx` - landing / role selector
- `tailwind.config.mjs` or `tailwind.config.js` - theme tokens (if present)

If you need changes, propose them in an issue or a draft branch and get sign-off before editing these files.

Somali (kooban):
Naqshadda guddiga (Admin) waa la xajin doonaa — ha wax ka badalin faylashan la magacaabay adigoon oggolaan haysan.
