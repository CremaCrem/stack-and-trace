# Stack & Trace — visual DSA lessons

A playful study site for Data Structures and Algorithms. Built for CC 104 (IDSC), usable by any class.
Every topic is a **lesson** (short animated pictures, a few words each, playing on their own)
followed by step-by-step **labs** that students can play, rewind, and test themselves on (PREDICT mode).

## Use it for your own class

Open `index.html` and edit the `ST.start({ ... })` block at the bottom: course, school, term, author.
Any field can be left empty. Course-specific choices live in each topic's `rules` list and show up
in a yellow **CLASS RULES** box, so outside visitors can tell "our convention" from "how the algorithm works".

## Open it

- **On your computer:** double-click `index.html`. No install, no build step.
- **Online:** upload the whole folder to any static host.
  - GitHub Pages: push the folder to a repo → Settings → Pages → deploy from the main branch.
  - Netlify: drag the folder onto app.netlify.com/drop.

Fonts load from Google Fonts. Without internet the site still works with fallback fonts.

## Worlds and labs

| # | World | Labs |
|---|-------|------|
| 1 | Arrays & Big-O | Memory address · Dynamic array grows · Big-O race |
| 2 | Searching | Linear search · Binary search · Number hunt (game) |
| 3 | Stacks & Queues | Stack · Queue |
| 4 | Linked Lists | Insert, delete, search, update · Singly / doubly / circular |
| 5 | Sorting | Bubble · Selection · Insertion · Race all three |
| 6 | Recursion, Merge & Quick Sort | Call stack · Merge Sort · Quick Sort |
| 7 | Trees, BST & AVL | BST insert & search · Traversals · AVL rotations |
| 8 | Heaps & Heap Sort | Build a heap · Heap sort · Index explorer |
| 9 | Hash Tables, Maps & Sets | Hash function · Collisions · Map vs Set |
| 10 | Graphs: BFS & DFS | BFS (whiteboard) · DFS (whiteboard) · Matrix & list |
| 11 | Shortest Paths & MST | Dijkstra · Bellman-Ford · Prim · Kruskal |
| 12 | Greedy Algorithms | Coin change · Activity selection · Knapsack · Huffman |

## Class rules

Each topic lists its own in `rules: [{ rule, note }]` (e.g. "Start at A — BFS and DFS can start at any vertex").
They render as the CLASS RULES box between the lesson and the labs. Delete or edit them for your course.

## Color code (same in every lab)

Yellow = looking at it now · Blue dashed = waiting in line · Teal = finished · Red = swap / problem / removed.

## Keyboard

→ next step · ← back · Space play/pause · Home/End first/last step.

## Files

```
index.html          page shell
css/main.css        all styles
js/core/            engine: helpers, pixel art, sound, SVG scene, step player, lesson beats, pages
js/topics/          one file per world (01-basics.js … 12-greedy.js)
assets/favicon.svg
```

To add or edit a lesson, open the topic file. Both the lesson and the labs are lists of frames
(one picture + one short caption per step):

- `lesson()` returns beats: `{ title, frames: [{ nodes, edges, cap }], trap? }`.
  Beats loop on their own while on screen. `trap: true` draws a red "common mistake" beat.
  Helpers for building frames live in `ST.lk` (`js/core/lesson.js`).
- Each lab builds its frames and the step player does the rest.
