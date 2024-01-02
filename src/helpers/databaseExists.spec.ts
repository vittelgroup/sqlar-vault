import { expect, it, afterEach } from "vitest";
import { databaseExists } from "./databaseExists.ts";
import { createSQLiteStorage } from "../FileStorageManager.ts";
import fs from "node:fs/promises";

it("should return true if a database with the same already exists", async () => {
  await createSQLiteStorage("storage.db");
  expect(await databaseExists("storage.db")).toBe(true);
});

it("should return false if a database with the same doesn't exists", async () => {
  expect(await databaseExists("storage.db")).toBe(false);
});

afterEach(() => {
  fs.unlink("storage.db")
    .then(() => {
      fs.unlink("storage.db-shm")
        .then(() => {
          fs.unlink("storage.db-wal")
            .then(() => {})
            .catch(() => {});
        })
        .catch(() => {});
    })
    .catch(() => {});
});
