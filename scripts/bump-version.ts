import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

const SEMVER = /^\d+\.\d+\.\d+$/;

async function readJson<T>(path: string): Promise<T> {
    return JSON.parse(await readFile(path, "utf8")) as T;
}

async function writeJson(path: string, value: unknown): Promise<void> {
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function main(version: string | undefined): Promise<void> {
    if (!version || !SEMVER.test(version)) throw new Error("Usage: yarn bump <major.minor.patch>");

    const pkg = await readJson<{ version: string }>("package.json");
    const manifest = await readJson<{ version: string; minAppVersion: string }>("manifest.json");
    const versions = await readJson<Record<string, string>>("versions.json");

    await writeJson("package.json", { ...pkg, version });
    await writeJson("manifest.json", { ...manifest, version });
    await writeJson("versions.json", { ...versions, [version]: manifest.minAppVersion });
    console.log(`Bumped to ${version} (minAppVersion ${manifest.minAppVersion})`);
}

await main(process.argv[2]);
