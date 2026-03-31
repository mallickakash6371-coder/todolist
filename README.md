# TaskFlow — Premium 3D To-Do App

A stunning, fully functional To-Do List web application with a premium 3D UI.

## How to Run

**No build step required.** Simply open `index.html` in any modern browser:

```
double-click  →  index.html
```

Or serve locally with Python:
```bash
python -m http.server 8080
# then open: http://localhost:8080
```

## Features

| Feature | Status |
|---------|--------|
| Add / Edit / Delete tasks | ✅ |
| Mark complete + Undo | ✅ |
| Inline edit (double-click) | ✅ |
| Drag & Drop reorder | ✅ |
| Categories (Work, Personal, Study, Health, Finance, Other) | ✅ |
| Priority levels (Low, Medium, High) | ✅ |
| Due date with overdue detection | ✅ |
| Filter: All / Pending / Completed | ✅ |
| Filter by Category & Priority (sidebar) | ✅ |
| Sort by Order / Date / Priority / Created | ✅ |
| Search bar | ✅ |
| Dark / Light mode toggle | ✅ |
| LocalStorage persistence | ✅ |
| 3D tilt card effect (mouse hover) | ✅ |
| Progress tracker | ✅ |
| Toast notifications | ✅ |
| Skeleton loader | ✅ |
| Sound feedback | ✅ |
| Responsive (mobile + desktop) | ✅ |
| Collapsible sidebar (mobile) | ✅ |

## File Structure

```
anti/
├── index.html    ← Entry point
├── styles.css    ← All styles (glassmorphism, animations, themes)
├── app.js        ← All logic (state, rendering, events)
└── README.md
```
