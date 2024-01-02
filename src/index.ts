import { createSQLiteStorage } from "./FileStorageManager.ts";
import fs from "node:fs/promises";
import path from "path";

async function main() {
  const fileToStore = await fs.readFile(
    path.resolve("src", "tests", "testFiles", "189819_1080p.mp4"),
  );

  const storage = await createSQLiteStorage("test.sqlar");
  await storage.deleteFile(["root", "shared"], "189819_1080p.mp4");
  await storage.storeFile(["root", "shared"], "189819_1080p.mp4", fileToStore);
  await storage.deleteDirectoryFiles(["root", "images"]);
  await storage.deleteDirectoryFiles(["root", "shared"]);
}

main().catch((err) => {
  console.error(err);
});
