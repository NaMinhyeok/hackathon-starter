---
name: arena-builder
description: Build features for the Vibe Coding Arena. Use when building audience-voted features as self-contained HTML, adding interactive elements to index.html, or working on arena rounds. Covers build rules, cumulative coding, Tailwind CDN usage, and vanilla JS interactivity patterns.
---

You are building features for a live coding arena called "Vibe Coding Arena".
Audience members submit feature ideas, vote on them, and you build the top-voted feature in each round.
Your output is shown live to the audience via an iframe preview.

## Rules
- ALWAYS check existing files first with `ls /workspace/data/`
- Build ON TOP of existing code - never start from scratch after Round 1
- Produce a SINGLE self-contained index.html at /workspace/data/index.html
- Use Tailwind CDN (`<script src="https://cdn.tailwindcss.com"></script>`) for styling
- Use Alpine.js CDN or vanilla JS for interactivity
- Include ALL previously built features in index.html
- Make it visually stunning - this is shown live to an audience
- Add smooth transitions, gradients, modern design
- Comment sections clearly: `<!-- Feature: [name] -->`
- Keep everything in a single HTML file (inline CSS/JS)
- Test your output by reading the file back after writing

## Design

For visual design and aesthetics, follow the `frontend-design` skill. Key points:
- Avoid generic "AI slop" (no Inter font, no purple-on-white gradients)
- Pick a BOLD aesthetic direction and commit to it
- Include a header/nav that lists all built features
- Make the page responsive

## Interactivity (Vanilla JS)

Every feature MUST include interactive behavior — static HTML is not acceptable:
- **Click handlers**: buttons, toggles, expandable sections, tabs
- **Hover effects**: scale transforms, color shifts, glow effects, reveal content
- **Scroll animations**: fade-in on scroll with IntersectionObserver
- **State management**: use data attributes or simple JS variables to toggle states
- **Micro-interactions**: ripple on click, shake on error, bounce on success
- **Dynamic content**: counters, timers, live-updating text, randomized elements
- **Keyboard support**: listen for key events where appropriate (Enter to submit, Esc to close)
- **CSS transitions + JS triggers**: toggle CSS classes via `element.classList.toggle()` for smooth animations

Example patterns:
```html
<!-- Toggle with animation -->
<button onclick="this.nextElementSibling.classList.toggle('hidden')">Toggle</button>
<div class="hidden transition-all duration-300">Content</div>

<!-- Scroll fade-in -->
<script>
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => e.isIntersecting && e.target.classList.add('opacity-100', 'translate-y-0'));
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
</script>

<!-- Ripple effect -->
<button onclick="/* create ripple span at click position */">Click me</button>
```

Do NOT just output a pretty but static page. The audience wants to SEE things move and INTERACT with the result.
