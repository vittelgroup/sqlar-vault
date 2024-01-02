import { describe, it, beforeAll, afterAll, expect } from "vitest";
import {
  type FileStorageManager,
  createSQLiteStorage,
} from "./FileStorageManager.ts";
import fs from "node:fs/promises";
import path from "path";
import {
  getStorageManagerState,
  setStorageManagerState,
} from "./tests/fixtures/storageDB.ts";

const storageDBName = `test_${Date.now()}.sqlar`;

describe("FileStorageManager", () => {
  beforeAll(async () => {
    setStorageManagerState(await createSQLiteStorage(storageDBName));
  });

  it("should be able to store a pdf file and retrieve it", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "drylab.pdf";

    const originalFile = await fs.readFile(
      path.resolve("src", "tests", "testFiles", fileName),
    );

    await storage.storeFile(["root", "pdf"], fileName, originalFile);

    const { success, file } = await storage.retrieveFile(
      ["root", "pdf"],
      fileName,
    );

    expect(success).toBe(true);
    expect(file).toHaveProperty("name", `/root/pdf/${fileName}`);
    expect(file).toHaveProperty("mode", 0o644);
    expect(file).toHaveProperty("mtime");
    expect(file).toHaveProperty("sz", originalFile.length);
    expect(file).toHaveProperty("data");
  });

  it("should be able to store a mp4 video file and retrieve it", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "189819_1080p.mp4";

    const originalFile = await fs.readFile(
      path.resolve("src", "tests", "testFiles", fileName),
    );

    await storage.storeFile(["root", "mp4"], fileName, originalFile);

    const { success, file } = await storage.retrieveFile(
      ["root", "mp4"],
      fileName,
    );

    expect(success).toBe(true);
    expect(file).toHaveProperty("name", `/root/mp4/${fileName}`);
    expect(file).toHaveProperty("mode", 0o644);
    expect(file).toHaveProperty("mtime");
    expect(file).toHaveProperty("sz", originalFile.length);
    expect(file).toHaveProperty("data");
  });

  it("should be able to store a jpg image file and retrieve it", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "neom-THlO6Mkf5uI-unsplash.jpg";

    const originalFile = await fs.readFile(
      path.resolve("src", "tests", "testFiles", fileName),
    );

    await storage.storeFile(["root", "jpg"], fileName, originalFile);

    const { success, file } = await storage.retrieveFile(
      ["root", "jpg"],
      fileName,
    );

    expect(success).toBe(true);
    expect(file).toHaveProperty("name", `/root/jpg/${fileName}`);
    expect(file).toHaveProperty("mode", 0o644);
    expect(file).toHaveProperty("mtime");
    expect(file).toHaveProperty("sz", originalFile.length);
    expect(file).toHaveProperty("data");
  });

  it("should be able to store a png image file and retrieve it", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "pexels-ovan-57690.png";

    const originalFile = await fs.readFile(
      path.resolve("src", "tests", "testFiles", fileName),
    );

    await storage.storeFile(["root", "png"], fileName, originalFile);

    const { success, file } = await storage.retrieveFile(
      ["root", "png"],
      fileName,
    );

    expect(success).toBe(true);
    expect(file).toHaveProperty("name", `/root/png/${fileName}`);
    expect(file).toHaveProperty("mode", 0o644);
    expect(file).toHaveProperty("mtime");
    expect(file).toHaveProperty("sz", originalFile.length);
    expect(file).toHaveProperty("data");
  });

  it("should NOT be able to store a file with the same name", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "pexels-ovan-57690.png";

    const originalFile = await fs.readFile(
      path.resolve("src", "tests", "testFiles", fileName),
    );

    const { success, file: fileWithTheSameName } = await storage.retrieveFile(
      ["root", "png"],
      fileName,
    );

    expect(success).toBe(true);
    expect(fileWithTheSameName).toHaveProperty("name", `/root/png/${fileName}`);
    expect(fileWithTheSameName).toHaveProperty("mode", 0o644);
    expect(fileWithTheSameName).toHaveProperty("mtime");
    expect(fileWithTheSameName).toHaveProperty("sz");
    expect(fileWithTheSameName).toHaveProperty("data");

    const operationStatus = await storage.storeFile(
      ["root", "png"],
      fileName,
      originalFile,
    );

    expect(operationStatus.success).toBe(false);
    expect(operationStatus.error).toBe("FileAlreadyExists");
  });

  it("should be able to delete an existing file", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "pexels-ovan-57690.png";

    const deleteOpStatus = await storage.deleteFile(["root", "png"], fileName);

    expect(deleteOpStatus.success).toBe(true);

    const retrieveFileOpStatus = await storage.retrieveFile(
      ["root", "png"],
      fileName,
    );

    expect(retrieveFileOpStatus.success).toBe(false);
    expect(retrieveFileOpStatus.file).toBe(undefined);
  });

  it("should be able to list all files in a given directory", async () => {
    const storage = getStorageManagerState() as FileStorageManager;

    const listFilesOpStatus = await storage.listFiles(["root", "mp4"]);
    expect(listFilesOpStatus.success).toBe(true);
    expect(listFilesOpStatus.files.length).toBeGreaterThan(0);
  });

  afterAll(() => {
    fs.unlink(storageDBName)
      .then(() => {
        fs.unlink(`${storageDBName}-shm`)
          .then(() => {
            fs.unlink(`${storageDBName}-wal`)
              .then(() => {})
              .catch(() => {});
          })
          .catch(() => {});
      })
      .catch(() => {});
  });
});
