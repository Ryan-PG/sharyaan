import fs from "node:fs";

const data = JSON.parse(fs.readFileSync(new URL("../src/data/stations.json", import.meta.url), "utf8"));
const stations = Object.fromEntries(
  Object.entries(data).map(([id, station]) => [
    id,
    {
      id,
      lines: station.lines.map(Number),
      relations: station.relations ?? [],
    },
  ]),
);

const adjacency = new Map(Object.keys(stations).map((id) => [id, []]));

for (const station of Object.values(stations)) {
  for (const relationId of station.relations) {
    const relation = stations[relationId];
    if (!relation) throw new Error(`Missing relation: ${station.id} -> ${relationId}`);
    adjacency.get(station.id).push(relation.id);
    adjacency.get(relation.id).push(station.id);
  }
}

const path = shortestPath("Tajrish", "Meydan-e Ketab");

if (!path.length) {
  throw new Error("Expected a route between Tajrish and Meydan-e Ketab");
}

console.log(`Route smoke test passed: ${path.length - 1} stops`);
console.log(path.join(" -> "));

function shortestPath(origin, destination) {
  const queue = [origin];
  const previous = new Map([[origin, null]]);

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (current === destination) break;

    for (const next of adjacency.get(current) ?? []) {
      if (previous.has(next)) continue;
      previous.set(next, current);
      queue.push(next);
    }
  }

  if (!previous.has(destination)) return [];

  const path = [];
  let cursor = destination;
  while (cursor) {
    path.push(cursor);
    cursor = previous.get(cursor);
  }

  return path.reverse();
}
