import { describe, it, beforeAll, afterAll, expect } from "vitest";
import {
  type FileStorageManager,
  createSQLiteVault,
} from "./FileStorageManager.ts";
import fs from "node:fs/promises";
import path from "path";
import {
  getStorageManagerState,
  setStorageManagerState,
} from "./tests-utils/fixtures/storageDB.ts";
import { mockTextFiles } from "./tests-utils/mocks/mockFiles.ts";

const storageDBName = `test_${Date.now()}.sqlar`;

describe("FileStorageManager", () => {
  beforeAll(async () => {
    setStorageManagerState(await createSQLiteVault(storageDBName));
  });

  it("should be able to store a pdf file and retrieve it", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "drylab.pdf";

    const originalFile = await fs.readFile(
      path.resolve("src", "tests-utils", "mocks", fileName),
    );

    await storage.storeFile(["root", "pdf"], fileName, originalFile);

    const { success, file } = await storage.retrieveFile(
      ["root", "pdf"],
      fileName,
    );

    expect(success).toBe(true);
    expect(file).toHaveProperty("fileNameWithPath", `/root/pdf/${fileName}`);
    expect(file).toHaveProperty("mode", 0o644);
    expect(file).toHaveProperty("mtime");
    expect(file).toHaveProperty("sz", originalFile.length);
    expect(file).toHaveProperty("data");
  });

  it("should be able to store a blob text file and retrieve it", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "hello.txt";
    const fileContent =
      "Hello World!\nLoremIpsum\nNeque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...";

    const originalFile = new Blob([fileContent], { type: "text/plain" });

    await storage.storeFile(["root", "blob"], fileName, originalFile);

    const { success, file } = await storage.retrieveFile(
      ["root", "blob"],
      fileName,
    );

    expect(success).toBe(true);
    expect(file).toHaveProperty("fileNameWithPath", `/root/blob/${fileName}`);
    expect(file).toHaveProperty("mode", 0o644);
    expect(file).toHaveProperty("mtime");
    expect(file).toHaveProperty("sz", originalFile.size);
    expect(file).toHaveProperty("data");
  });

  it("should be able to store a mp4 video file and retrieve it", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "189819_1080p.mp4";

    const originalFile = await fs.readFile(
      path.resolve("src", "tests-utils", "mocks", fileName),
    );
    console.log(fileName, originalFile.byteLength);
    await storage.storeFile(["root", "mp4"], fileName, originalFile);

    const { success, file } = await storage.retrieveFile(
      ["root", "mp4"],
      fileName,
    );

    expect(success).toBe(true);
    expect(file).toHaveProperty("fileNameWithPath", `/root/mp4/${fileName}`);
    expect(file).toHaveProperty("mode", 0o644);
    expect(file).toHaveProperty("mtime");
    expect(file).toHaveProperty("sz", originalFile.length);
    expect(file).toHaveProperty("data");
  });

  it("should be able to store a jpg image file and retrieve it", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "neom-THlO6Mkf5uI-unsplash.jpg";

    const originalFile = await fs.readFile(
      path.resolve("src", "tests-utils", "mocks", fileName),
    );

    await storage.storeFile(["root", "jpg"], fileName, originalFile);

    const { success, file } = await storage.retrieveFile(
      ["root", "jpg"],
      fileName,
    );

    expect(success).toBe(true);
    expect(file).toHaveProperty("fileNameWithPath", `/root/jpg/${fileName}`);
    expect(file).toHaveProperty("mode", 0o644);
    expect(file).toHaveProperty("mtime");
    expect(file).toHaveProperty("sz", originalFile.length);
    expect(file).toHaveProperty("data");
  });

  it("should be able to store a png image file and retrieve it", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "pexels-ovan-57690.png";

    const originalFile = await fs.readFile(
      path.resolve("src", "tests-utils", "mocks", fileName),
    );

    await storage.storeFile(["root", "png"], fileName, originalFile);

    const { success, file } = await storage.retrieveFile(
      ["root", "png"],
      fileName,
    );

    expect(success).toBe(true);
    expect(file).toHaveProperty("fileNameWithPath", `/root/png/${fileName}`);
    expect(file).toHaveProperty("mode", 0o644);
    expect(file).toHaveProperty("mtime");
    expect(file).toHaveProperty("sz", originalFile.length);
    expect(file).toHaveProperty("data");
  });

  it("should NOT be able to store a file with the same name", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "pexels-ovan-57690.png";

    const originalFile = await fs.readFile(
      path.resolve("src", "tests-utils", "mocks", fileName),
    );

    const { success, file: fileWithTheSameName } = await storage.retrieveFile(
      ["root", "png"],
      fileName,
    );

    expect(success).toBe(true);
    expect(fileWithTheSameName).toHaveProperty(
      "fileNameWithPath",
      `/root/png/${fileName}`,
    );
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

  it("should NOT be able to delete a non-existing file", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "non-existing.png";

    const deleteOpStatus = await storage.deleteFile(["root", "png"], fileName);

    expect(deleteOpStatus.success).toBe(false);
    expect(deleteOpStatus.error).toBe("FileNotFound");
  });

  it("should NOT be able to retrieve a non-existing file", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "non-existing.png";

    const retrieveFileOpStatus = await storage.retrieveFile(
      ["root", "png"],
      fileName,
    );

    expect(retrieveFileOpStatus.success).toBe(false);
    expect(retrieveFileOpStatus.error).toBe("FileNotFound");
    expect(retrieveFileOpStatus.file).toBe(undefined);
  });

  it("should be able to list all files in a given directory", async () => {
    const storage = getStorageManagerState() as FileStorageManager;

    const listFilesOpStatus = await storage.listFiles(["root"]);
    expect(listFilesOpStatus.success).toBe(true);
    expect(listFilesOpStatus.files.length).toBeGreaterThan(0);
    expect(listFilesOpStatus.totalFiles).toBeGreaterThan(0);
    expect(listFilesOpStatus.currentPage).toBe(1);
  });

  it("should be able to list all files in a given directory ordered by 'name' descending", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const textFiles = mockTextFiles();
    let multiplier = 1;
    for (const { fileName, file } of textFiles) {
      await storage.storeFile(
        ["root", "text"],
        fileName,
        file,
        Math.round(Date.now() / 1000) + multiplier,
      );
      multiplier = multiplier + 2;
    }

    const list20FilesDescOpStatus = await storage.listFiles(
      ["root", "text"],
      20,
      1,
      "name",
      "DESC",
    );
    expect(list20FilesDescOpStatus.success).toBe(true);
    expect(list20FilesDescOpStatus.files.length).toBe(20);
    expect(list20FilesDescOpStatus.files[0].fileNameWithPath).toBe(
      "/root/text/z_hello.txt",
    );
    expect(list20FilesDescOpStatus.totalFiles).toBe(25);
    expect(list20FilesDescOpStatus.currentPage).toBe(1);
  });

  it("should be able to search all files in a given directory that contains '_hello.txt'", async () => {
    const storage = getStorageManagerState() as FileStorageManager;

    const searchedFilesInDirectory = await storage.searchFiles(
      "_hello.txt",
      ["root", "text"],
      20,
      1,
      "name",
      "DESC",
    );
    expect(searchedFilesInDirectory.success).toBe(true);
    expect(searchedFilesInDirectory.files.length).toBe(20);
    expect(searchedFilesInDirectory.files[0].fileNameWithPath).toBe(
      "/root/text/z_hello.txt",
    );

    const searchedFilesInStorage = await storage.searchFiles(
      "_hello.txt",
      [],
      20,
      1,
      "name",
      "DESC",
    );
    expect(searchedFilesInStorage.success).toBe(true);
    expect(searchedFilesInStorage.files.length).toBe(20);
    expect(searchedFilesInStorage.files[0].fileNameWithPath).toBe(
      "/root/text/z_hello.txt",
    );
  });

  it("should be able to list all files in a given directory ordered by 'mtime' ascending", async () => {
    const storage = getStorageManagerState() as FileStorageManager;

    const list5FilesAscOpStatus = await storage.listFiles(
      ["root", "text"],
      20,
      1,
      "mtime",
      "ASC",
    );

    expect(list5FilesAscOpStatus.success).toBe(true);
    expect(list5FilesAscOpStatus.files.length).toBe(20);
    expect(list5FilesAscOpStatus.files[0].fileNameWithPath).toBe(
      "/root/text/a_hello.txt",
    );
    expect(list5FilesAscOpStatus.totalFiles).toBe(25);
    expect(list5FilesAscOpStatus.currentPage).toBe(1);
  });

  it("should return an empty array on a non-existing directory", async () => {
    const storage = getStorageManagerState() as FileStorageManager;

    const listFilesInEmptyDirOpStatus = await storage.listFiles([""]);

    expect(listFilesInEmptyDirOpStatus.success).toBe(true);
    expect(listFilesInEmptyDirOpStatus.files.length).toBe(0);
    expect(listFilesInEmptyDirOpStatus.totalFiles).toBe(0);

    const listFilesInNonExistingDirOpStatus = await storage.listFiles([
      "non-existing-directory",
    ]);

    expect(listFilesInNonExistingDirOpStatus.success).toBe(true);
    expect(listFilesInNonExistingDirOpStatus.files.length).toBe(0);
    expect(listFilesInNonExistingDirOpStatus.totalFiles).toBe(0);
  });

  it("should NOT be able to delete all files in a non-existing or empty directory", async () => {
    const storage = getStorageManagerState() as FileStorageManager;

    const listFilesInNonExistingDirOpStatus = await storage.listFiles([
      "non-existing-directory",
    ]);

    expect(listFilesInNonExistingDirOpStatus.files.length).toBe(0);

    const deleteNonExistingDirOpStatus = await storage.deleteDirectoryFiles([
      "non-existing-directory",
    ]);

    expect(deleteNonExistingDirOpStatus.success).toBe(false);
    expect(deleteNonExistingDirOpStatus.error).toBe("DirectoryAlreadyEmpty");

    const deleteEmptyDirDirOpStatus = await storage.deleteDirectoryFiles([""]);

    expect(deleteEmptyDirDirOpStatus.success).toBe(false);
    expect(deleteEmptyDirDirOpStatus.error).toBe("DirectoryAlreadyEmpty");
  });

  it("should be able to delete all files in an existing directory", async () => {
    const storage = getStorageManagerState() as FileStorageManager;

    const listFilesOpStatus = await storage.listFiles(["root", "blob"]);

    expect(listFilesOpStatus.files.length).toBeGreaterThan(0);

    const deleteOpStatus = await storage.deleteDirectoryFiles(["root", "blob"]);

    expect(deleteOpStatus.success).toBe(true);

    const listFilesAfterDeleteOpStatus = await storage.listFiles([
      "root",
      "blob",
    ]);

    expect(listFilesAfterDeleteOpStatus.success).toBe(true);
    expect(listFilesAfterDeleteOpStatus.files.length).toBe(0);
  });

  it("should be able to count all files from the storage", async () => {
    const storage = getStorageManagerState() as FileStorageManager;

    const { total } = await storage.getTotalFiles();

    expect(total).toBeGreaterThan(0);
  });

  it("should be able to rename a file", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "neom-THlO6Mkf5uI-unsplash.jpg";

    const retrieveFileOpStatus = await storage.retrieveFile(
      ["root", "jpg"],
      fileName,
    );

    expect(retrieveFileOpStatus.success).toBe(true);
    expect(retrieveFileOpStatus.file?.fileNameWithPath).toBe(
      "/root/jpg/neom-THlO6Mkf5uI-unsplash.jpg",
    );

    const renameFileOpStatus = await storage.renameFile(
      ["root", "jpg"],
      fileName,
      "neom-THlO6Mkf5uI-unsplash_RENAMED.jpg",
    );

    expect(renameFileOpStatus.success).toBe(true);
    expect(renameFileOpStatus.newFileNameWithPath).toBe(
      "/root/jpg/neom-THlO6Mkf5uI-unsplash_RENAMED.jpg",
    );
  });

  it("should NOT be able to rename a file to an existing filename", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "neom-THlO6Mkf5uI-unsplash_RENAMED.jpg";

    const retrieveFileOpStatus = await storage.retrieveFile(
      ["root", "jpg"],
      fileName,
    );

    expect(retrieveFileOpStatus.success).toBe(true);
    expect(retrieveFileOpStatus.file?.fileNameWithPath).toBe(
      "/root/jpg/neom-THlO6Mkf5uI-unsplash_RENAMED.jpg",
    );

    const renameFileOpStatus = await storage.renameFile(
      ["root", "jpg"],
      fileName,
      "z_hello.txt",
      ["root", "text"],
    );

    expect(renameFileOpStatus.success).toBe(false);
    expect(renameFileOpStatus.error).toBe("FileAlreadyExists");
  });

  it("should be able to update a file content", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "neom-THlO6Mkf5uI-unsplash_RENAMED.jpg";

    const retrieveOriginalFileOpStatus = await storage.retrieveFile(
      ["root", "jpg"],
      fileName,
    );

    expect(retrieveOriginalFileOpStatus.success).toBe(true);

    const newContent = Buffer.from("Hello World!_NEW_CONTENT");

    const updatedFile = await storage.updateFileContent(
      ["root", "jpg"],
      fileName,
      newContent,
      Math.round(Date.now() / 1000) + 5,
    );
    expect(updatedFile.success).toBe(true);

    const retrieveUpdatedFileOpStatus = await storage.retrieveFile(
      ["root", "jpg"],
      fileName,
    );

    expect(
      retrieveOriginalFileOpStatus.file?.sz !==
        retrieveUpdatedFileOpStatus.file?.sz,
    ).toBe(true);
    expect(retrieveUpdatedFileOpStatus.file?.sz).toBe(newContent.byteLength);
    expect(retrieveUpdatedFileOpStatus.file?.mtime).toBeGreaterThan(
      retrieveOriginalFileOpStatus.file?.mtime ?? 0,
    );
  });

  it("should NOT be able to update a non-existing file content", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const fileName = "non-existing.jpg";

    const retrieveOriginalFileOpStatus = await storage.retrieveFile(
      ["root", "jpg"],
      fileName,
    );

    expect(retrieveOriginalFileOpStatus.success).toBe(false);

    const newContent = Buffer.from("Hello World!_NEW_CONTENT");

    const updatedFile = await storage.updateFileContent(
      ["root", "jpg"],
      fileName,
      newContent,
      Math.round(Date.now() / 1000) + 5,
    );
    expect(updatedFile.success).toBe(false);

    expect(updatedFile.error).toBe("FileNotFound");
  });

  it("should be able to delete all files from the storage", async () => {
    const storage = getStorageManagerState() as FileStorageManager;
    const { total } = await storage.getTotalFiles();

    expect(total).toBeGreaterThan(0);

    await storage.deleteAllFiles();

    const { total: totalFilesAfterDeletion } = await storage.getTotalFiles();

    expect(totalFilesAfterDeletion).toBe(0);
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
