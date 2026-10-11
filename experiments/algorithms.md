# Algorithms exploration

Routes: `/algorithms/`, `/algorithms/pathfinding/`, and permanent algorithm lesson URLs beneath `/algorithms/pathfinding/`.

The header exposes one Algorithms link under Explorations. These pages are not content-collection entries and do not enter the homepage essay feed.

## Add an algorithm

1. Add its name, slug, family, prerequisites, summary, objective, explanation, limitations, and qualified complexity to `src/data/algorithms.ts`.
2. For another graph-search algorithm, implement the operation recorder in `public/scripts/algorithms-engine.mjs`, add corresponding pseudocode, and extend the algorithm selection behavior in `algorithms-ui.mjs`. Preserve the graph when changing algorithms.
3. Keep every frame immutable. The visualization, frontier, table, highlighted line, and explanation must describe the same operation. Highlight real checks even when they do not change the data.
4. Test against an independent reference calculation, including disconnected graphs, identical endpoints, weight edits, and ties. `npm run test:algorithms` is part of the normal build.
5. Add source-backed explanations and a release-journal entry. Do not imply the illustrative implementation achieves the bounds of a different data structure.

## Add a family

Register the family in the catalog and create its shared playground route and permanent lesson routes. Reuse navigation, teaching conventions, and playback concepts; choose a visualization and internal-state display that suit the actual algorithm. Sorting and backtracking should not be forced into a graph-search interface. Display only populated families.

## Pathfinding details

All connections are undirected and have integer weights from 1 to 99. BFS minimizes edge count. Dijkstra and A* minimize total weight. Ties for the weighted frontier use node ID; BFS follows edge-list neighbor order.

A* uses Euclidean distance multiplied by the minimum weight/length ratio across all edges. This is admissible and consistent, by the triangle inequality. Recompute after every graph edit and after changing between desktop and mobile graph geometry. Mobile uses a vertical graph with legible node labels.

The teaching implementation uses array scans and frontier sorting. It intentionally prioritizes inspection over large-graph performance. Snapshot storage is additional to search memory. There are nine nodes; connections and weights are editable. No server, account, or external data access is required.


## October 11, 2026 expansion

Six algorithms now share this playground. DFS uses explicit call frames with a neighbor cursor, preserving recursive depth-first behavior and showing backtracking. Its displayed tree depth is not a shortest distance. Greedy best-first search discovers nodes once and ranks only by the remaining estimate; displayed route cost is not guaranteed optimal.

Bidirectional BFS alternates complete layers and minimizes the sum of the two depths over meeting nodes in the first overlapping layer. Finish the layer before returning. Frames preserve independent queues, predecessor maps, and distance tables from both endpoints. Cyan indicates the start side; amber indicates the goal side. Goal-side arrows point toward the destination. Tests compare its returned edge count with independent all-pairs shortest paths across every endpoint pair in randomized graphs.
