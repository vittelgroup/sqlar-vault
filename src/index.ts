import { createSQLiteStorage } from "./FileStorageManager.ts";
import fs from "node:fs/promises";

async function main() {
  const fileToStore = await fs.readFile("image_3EB090335112C0E5EFE98A.jpeg");

  const storage = await createSQLiteStorage("test.sqlar");
  await storage.deleteFile(["root"], "image_3EB090335112C0E5EFE98A.jpeg");
  await storage.storeFile(
    ["root"],
    "image_3EB090335112C0E5EFE98A.jpeg",
    fileToStore,
  );
  const file = await storage.retrieveFile(
    ["root"],
    "image_3EB090335112C0E5EFE98A.jpeg",
  );
  console.log({ file });
}

main().catch((err) => {
  console.error(err);
});
