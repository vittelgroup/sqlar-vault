import BetterDatabase, { type Database } from "better-sqlite3";
import SQLiteStorageError from "./errors/SQLiteStorageError.ts";
import path from "path";

export interface SQLarTable {
  name: string;
  mode: number;
  mtime: number;
  sz: number;
  data: Buffer;
}
/**
 * Manages the storage of files in a database using SQLite.
 */
class FileStorageManager {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  private fileExists(filePath: string): boolean {
    const file = this.db
      .prepare<SQLarTable["name"]>("SELECT name FROM sqlar WHERE name = ?")
      .get(filePath) as SQLarTable | undefined;
    return file !== undefined;
  }

  private sanitizePath(filePath: string[]): string[] {
    return filePath.map((dir) => dir.trim().replace(/\/|\s|\\/g, "_"));
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
   * If the file already exists, an error is thrown.
   *
   * @param dir - The directory path where the file will be stored.
   * Example: ["root", "images", "profile"]
   * @param fileName - The name of the file.
   * Example: "profile.jpeg"
   * @param file - The file to be stored, either as a Blob or a Buffer.
   * @returns An object containing the original file name and the file name with the full path.
   * @throws {SQLiteStorageError} If the file already exists.
   */
  async storeFile(dir: string[], fileName: string, file: Blob | Buffer) {
    const fileNameWithPath = this.createFileNameWithPath(dir, fileName);

    if (this.fileExists(fileNameWithPath)) {
      throw new SQLiteStorageError(
        "FileExists",
        `File '${fileNameWithPath}' already exists!`,
      );
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
          SQLarTable["name"],
          SQLarTable["mode"],
          SQLarTable["mtime"],
          SQLarTable["sz"],
          SQLarTable["data"],
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

    return { fileName, fileNameWithPath };
  }

  /**
   * Retrieves a file from the storage.
   * @param dir - The directory path of the file.
   * Example: ["root", "images", "profile"]
   * @param fileName - The name of the file.
   * Example: "profile.jpeg"
   * @returns A promise that resolves to the retrieved file as a SQLarTable object, or undefined if the file does not exist.
   */
  async retrieveFile(
    dir: string[],
    fileName: string,
  ): Promise<SQLarTable | undefined> {
    const fileNameWithPath = this.createFileNameWithPath(dir, fileName);
    const file = this.db
      .prepare<SQLarTable["name"]>(
        "SELECT name, mode, datetime(mtime,'unixepoch') as mtime, sqlar_uncompress(data,sz) as data, sz FROM sqlar WHERE name = ?",
      )
      .get(fileNameWithPath) as SQLarTable | undefined;
    return file;
  }

  /**
   * Deletes a file from the storage.
   * @param dir - The directory path where the file is located.
   * Example: ["root", "images", "profile"]
   * @param fileName - The name of the file to be deleted.
   * Example: "profile.jpeg"
   * @returns A promise that resolves when the file is successfully deleted.
   */
  async deleteFile(dir: string[], fileName: string): Promise<void> {
    const fileNameWithPath = this.createFileNameWithPath(dir, fileName);

    console.log({ fileNameWithPath });
    this.db
      .prepare<SQLarTable["name"]>("DELETE FROM sqlar WHERE name = ?")
      .run(fileNameWithPath);
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
