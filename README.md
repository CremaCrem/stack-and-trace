# Stack & Trace — CC 104 visual labs

A playful study site for CC 104 Data Structures and Algorithms (IDSC, 1st Sem A.Y. 2026–2027).
Every lesson is a short set of "remember" cards plus step-by-step labs that students can play,
rewind, and test themselves on (PREDICT mode).

## Open it

- **On your computer:** double-click `index.html`. No install, no build step.
- **Online:** upload the whole folder to any static host.
  - GitHub Pages: push the folder to a repo → Settings → Pages → deploy from the main branch.
  - Netlify: drag the folder onto app.netlify.com/drop.

Fonts load from Google Fonts. Without internet the site still works with fallback fonts.

## Worlds and labs

| # | World | Week | Labs |
|---|-------|------|------|
| 1 | Arrays & Big-O | 1–2 | Memory address · Dynamic array grows · Big-O race |
| 2 | Searching | 2 | Linear search · Binary search · Number hunt (game) |
| 3 | Stacks & Queues | 1 | Stack · Queue |
| 4 | Linked Lists | 3 | Insert, delete, search, update · Singly / doubly / circular |
| 5 | Sorting | 4 | Bubble · Selection · Insertion · Race all three |
| 6 | Recursion, Merge & Quick Sort | 6 | Call stack · Merge Sort · Quick Sort |
| 7 | Trees, BST & AVL | 7 | BST insert & search · Traversals · AVL rotations |
| 8 | Heaps & Heap Sort | 8 | Build a heap · Heap sort · Index explorer |
| 9 | Hash Tables, Maps & Sets | 11 | Hash function · Collisions · Map vs Set |
| 10 | Graphs: BFS & DFS | 12 | BFS (whiteboard) · DFS (whiteboard) · Matrix & list |
| 11 | Shortest Paths & MST | 13 | Dijkstra · Bellman-Ford · Prim · Kruskal |
| 12 | Greedy Algorithms | 14 | Coin change · Activity selection · Knapsack · Huffman |

## Class rules built in

- Start at A; check neighbors in alphabetical order.
- BFS whiteboard method: solid circle = dequeued, dashed circle = enqueued, level labels (L0, L1…),
  a queue line every step, and a Vertex | Level | Found by table at the end.
- DFS whiteboard method: path stack (push on visit, pop at a dead end), visit numbers,
  and the trace stops once every vertex is visited (the final pops are not drawn).
- Heaps: insert one value at a time, every insert and every swap is its own step;
  heap sort removes the root to DELETED, moves the last value up, heapifies down,
  then drops the value into the SORTED slot. A min heap gives descending order.
- AVL: (HL, HR) above each node, BF = HL − HR, empty subtree height 0.
- Sorting code panels use the C# methods from the Week 4 class program.
- Hashing: index = (sum of character codes) % table size, as in the Week 11 deck.

## Color code (same in every lab)

Yellow = looking at it now · Blue dashed = waiting in line · Teal = finished · Red = swap / problem / removed.

## Keyboard

→ next step · ← back · Space play/pause · Home/End first/last step.

## Files

```
index.html          page shell
css/main.css        all styles
js/core/            engine: helpers, pixel art, sound, SVG scene, step player, pages
js/topics/          one file per world (01-basics.js … 12-greedy.js)
assets/favicon.svg
```

To add or edit a lesson, open the topic file. Each lab builds a list of frames
(one picture + one short caption per step) and the player does the rest.
