import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";

const mapsDir = resolve("assets/maps");
const publicMapDir = resolve("public/maps/tehran");
const mbtilesPath = process.argv[2]
  ? resolve(process.argv[2])
  : readdirSync(mapsDir)
      .filter((file) => file.toLowerCase().endsWith(".mbtiles"))
      .map((file) => join(mapsDir, file))[0];

if (!mbtilesPath || !existsSync(mbtilesPath)) {
  throw new Error("No MBTiles file found in assets/maps.");
}

const query = `
import json
import sqlite3
import sys

path = sys.argv[1]
con = sqlite3.connect(path)
cur = con.cursor()
metadata = dict(cur.execute("select name, value from metadata"))
tiles = cur.execute("select zoom_level, tile_column, tile_row, tile_data from tiles").fetchall()
con.close()

print(json.dumps({
  "metadata": metadata,
  "tiles": [
    [zoom, column, row, data.hex()]
    for zoom, column, row, data in tiles
  ],
}))
`;

const raw = execFileSync("python", ["-c", query, mbtilesPath], {
  maxBuffer: 512 * 1024 * 1024,
});
const payload = JSON.parse(raw.toString("utf8"));
const metadata = payload.metadata ?? {};
const tiles = payload.tiles ?? [];
const scheme = metadata.scheme === "xyz" ? "xyz" : "tms";
const format = metadata.format || "pbf";

if (existsSync(publicMapDir)) {
  rmSync(publicMapDir, { recursive: true, force: true });
}
mkdirSync(publicMapDir, { recursive: true });

for (const [zoom, column, row, hex] of tiles) {
  const xyzRow = scheme === "tms" ? 2 ** zoom - 1 - row : row;
  const tilePath = join(publicMapDir, String(zoom), String(column), `${xyzRow}.${format}`);
  mkdirSync(dirname(tilePath), { recursive: true });
  const tileData = Buffer.from(hex, "hex");
  const normalizedTileData =
    format === "pbf" && tileData[0] === 0x1f && tileData[1] === 0x8b
      ? gunzipSync(tileData)
      : tileData;
  writeFileSync(tilePath, normalizedTileData);
}

const styleMetadata = {
  ...metadata,
  sourceMbtiles: basename(mbtilesPath),
  extractedTiles: tiles.length,
  extractedAt: new Date().toISOString(),
};
writeFileSync(join(publicMapDir, "metadata.json"), JSON.stringify(styleMetadata, null, 2));

const existingGitignore = existsSync(resolve("public/maps/.gitignore"))
  ? readFileSync(resolve("public/maps/.gitignore"), "utf8")
  : "";
if (!existingGitignore.includes("tehran/")) {
  mkdirSync(resolve("public/maps"), { recursive: true });
  writeFileSync(resolve("public/maps/.gitignore"), `${existingGitignore.trim()}\ntehran/\n`.trimStart());
}

console.log(`Extracted ${tiles.length} ${format} tiles from ${basename(mbtilesPath)} to ${publicMapDir}`);
