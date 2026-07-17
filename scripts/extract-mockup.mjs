import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const source = await readFile(resolve(projectRoot, "index.html"), "utf8")

const sprite = source.match(/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" style="display:none">[\s\S]*?<\/svg>/)?.[0]
const main = source.match(/<main>([\s\S]*?)<\/main>/)?.[1]

if (!sprite || !main) {
  throw new Error("Could not extract the icon sprite and screen markup from index.html")
}

const outputDir = resolve(projectRoot, "src", "legacy")
await mkdir(outputDir, { recursive: true })
await writeFile(resolve(outputDir, "icon-sprite.html"), `${sprite}\n`, "utf8")
await writeFile(resolve(outputDir, "screens.html"), `${main.trim()}\n`, "utf8")

console.log("Extracted the original icon sprite and screen markup into src/legacy")
