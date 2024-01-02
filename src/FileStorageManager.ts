import BetterDatabase, { type Database } from "better-sqlite3";
import path from "path";

export interface SQLarFile {
  name: string;
  mode: number;
  mtime: number;
  sz: number;
  data: Buffer;
}
/**
 * Manages the storage of files in a database using SQLite.
 */
export class FileStorageManager {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  private fileExists(filePath: string): boolean {
    const file = this.db
      .prepare<SQLarFile["name"]>("SELECT name FROM sqlar WHERE name = ?")
      .get(filePath) as SQLarFile | undefined;
    return file !== undefined;
  }

  private sanitizePath(filePath: string[]): string[] {
    return filePath
      .filter((dir) => dir.trim() !== "")
      .map((dir) => dir.trim().replace(/\/|\s|\\/g, "_"));
  }

  private createFileNameWithPath(filePath: string[], fileName: string): string {
    const sanitizedPath = this.sanitizePath(filePath).join("/");
    if (sanitizedPath === "") {
      return `/${fileName}`;
    }
    return `/${sanitizedPath}/${fileName}`;
  }

  private async blobToBuffer(blob: Blob): Promise<Buffer> {
    return Buffer.from(await blob.arrayBuffer());
  }

  /**
   * Stores a file in the specified directory with the given file name.
   * If the file already exists, it returns an error.
   *
   * @param dir - The directory path where the file will be stored.
   * Example: ["root", "images", "profile"] | Store the file in the '/root/images/profile' directory.
   * @param fileName - The name of the file.
   * Example: "profile.jpeg"
   * @param file - The file to be stored, either as a Blob or a Buffer.
   * @returns An object indicating the success of the operation and the file details.
   */
  async storeFile(dir: string[], fileName: string, file: Blob | Buffer) {
    const fileNameWithPath = this.createFileNameWithPath(dir, fileName);

    if (this.fileExists(fileNameWithPath)) {
      return { success: false, error: "FileAlreadyExists" };
    }

    let fileBuffer: Buffer;
    if (file instanceof Blob) {
      fileBuffer = await this.blobToBuffer(file);
    } else {
      fileBuffer = file;
    }

    this.db
      .prepare<
        [
          SQLarFile["name"],
          SQLarFile["mode"],
          SQLarFile["mtime"],
          SQLarFile["sz"],
          SQLarFile["data"],
        ]
      >(
        "INSERT INTO sqlar(name,mode,mtime,sz,data) VALUES (?, ?, ?, ?, sqlar_compress(?))",
      )
      .run(
        fileNameWithPath,
        0o644,
        Math.round(Date.now() / 1000),
        fileBuffer.byteLength,
        fileBuffer,
      );

    return { success: true, fileName, fileNameWithPath };
  }

  /**
   * Retrieves a file from the storage based on the specified directory and file name.
   * @param dir - The directory path of the file.
   * Example: ["root", "images", "profile"]
   * @param fileName - The name of the file.
   * Example: "profile.jpeg"
   * @returns A promise that resolves to an object containing the success status and the retrieved file, if successful.
   * If the file is not found, it returns an error 'FileNotFound'.
   */
  async retrieveFile(dir: string[], fileName: string) {
    const fileNameWithPath = this.createFileNameWithPath(dir, fileName);
    const file = this.db
      .prepare<SQLarFile["name"]>(
        "SELECT name, mode, datetime(mtime,'unixepoch') as mtime, sqlar_uncompress(data,sz) as data, sz FROM sqlar WHERE name = ?",
      )
      .get(fileNameWithPath) as SQLarFile | undefined;
    if (file === undefined) {
      return { success: false, error: "FileNotFound" };
    }
    return { success: true, file };
  }

  /**
   * Deletes a file from the storage.
   * @param dir - The directory path where the file is located.
   * Example: ["root", "images", "profile"]
   * @param fileName - The name of the file to be deleted.
   * Example: "profile.jpeg"
   * @returns An object indicating the success of the operation.
   * If the file is not found, it returns an error 'FileNotFound'.
   */
  async deleteFile(dir: string[], fileName: string) {
    const fileNameWithPath = this.createFileNameWithPath(dir, fileName);

    const result = this.db
      .prepare<SQLarFile["name"]>("DELETE FROM sqlar WHERE name = ?")
      .run(fileNameWithPath);

    if (result.changes === 0) {
      return { success: false, error: "FileNotFound" };
    }
    return {
      success: true,
    };
  }

  /**
   * Retrieves a list of files in the specified directory.
   * @param dir - The directory path.
   * @returns An array of files in the directory.
   */
  async listFiles(dir: string[]) {
    const sanitizedPath = this.sanitizePath(dir).join("/");
    const files = this.db
      .prepare<SQLarFile["name"]>(
        "SELECT name, mode, datetime(mtime,'unixepoch') as mtime, sz FROM sqlar WHERE name LIKE ?",
      )
      .all(`/${sanitizedPath}/%`) as Array<Omit<SQLarFile, "data">>;
    return { files, success: true };
  }

  /**
   * Deletes all files from the storage.
   * @returns A promise that resolves to an object indicating the success of the operation.
   * If there are no files to delete, it returns an error 'NoFilesToDelete'.
   */
  async deleteAllFiles() {
    const result = this.db.prepare("DELETE FROM sqlar").run();
    if (result.changes === 0) {
      return { success: false, error: "NoFilesToDelete" };
    }
    return { success: true };
  }

  /**
   * Deletes the files in the specified directory.
   *
   * @param dir - An array of directory names.
   * Example: ["root", "images"] | Delete all files in the '/root/images' directory.
   * @returns An object indicating the success of the operation.
   * If the param 'dir' is an empty array, it returns an error 'InvalidDirectoryPath'.
   * If the directory is empty, it returns an error 'DirectoryAlreadyEmpty'.
   */
  async deleteDirectoryFiles(dir: string[]) {
    const sanitizedPath = this.sanitizePath(dir).join("/");
    if (sanitizedPath === "") {
      return {
        success: false,
        error: "InvalidDirectoryPath",
      };
    }
    const directoryToDelete = `/${sanitizedPath}/%`;

    const result = this.db
      .prepare<SQLarFile["name"]>("DELETE FROM sqlar WHERE name LIKE ?")
      .run(directoryToDelete);
    if (result.changes === 0) {
      return { success: false, error: "DirectoryAlreadyEmpty" };
    }
    return { success: true };
  }
}

/**
 * Creates a SQLite storage manager for file storage.
 * @param databasePath The path to the SQLite database file.
 * @returns A promise that resolves to a FileStorageManager instance.
 */
export async function createSQLiteStorage(
  databasePath: string,
): Promise<FileStorageManager> {
  const db = new BetterDatabase(databasePath, {
    fileMustExist: false,
  });

  const extensionPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "sqlar")
      : path.resolve("src", "sqlite_extensions", "sqlar");

  db.loadExtension(extensionPath);
  db.pragma("journal_mode = WAL");

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS sqlar(
        name TEXT PRIMARY KEY,  -- name of the file
        mode INT,               -- access permissions
        mtime INT,              -- last modification time
        sz INT,                 -- original file size
        data BLOB               -- compressed content
      );
    `,
  ).run();

  return new FileStorageManager(db);
}
