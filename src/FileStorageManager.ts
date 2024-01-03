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
   * Retrieves the total number of files stored in the database.
   * @returns An object containing the total number of files.
   */
  async getTotalFiles() {
    const countFiles = this.db.prepare("SELECT count(*) as total FROM sqlar");
    return countFiles.get() as { total: number };
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
   * @param modifiedTime - (optional) The modified time of the file in seconds (Default is Date.now() / 1000).
   * @returns An object indicating the success of the operation and the file details.
   */
  async storeFile(
    dir: string[],
    fileName: string,
    file: Blob | Buffer,
    modifiedTime: number = Math.round(Date.now() / 1000),
  ) {
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
        modifiedTime,
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
   * Retrieves a list of files from the specified directory.
   *
   * @param dir - The directory path.
   * @param filesPerPage - The number of files to retrieve per page. Default is 20.
   * @param pageNumber - The page number to retrieve. Default is 1.
   * @param orderBy - The field to order the files by. Valid values are "name", "mtime", or "sz". Default is "name".
   * @param order - The order in which to sort the files. Valid values are "ASC" or "DESC". Default is "ASC".
   * @returns An object containing the list of files, current page, total files and a success flag.
   */
  async listFiles(
    dir: string[],
    filesPerPage: number = 20,
    pageNumber: number = 1,
    orderBy: "name" | "mtime" | "sz" = "name",
    order: "ASC" | "DESC" = "ASC",
  ) {
    const skip = pageNumber <= 1 ? 0 : (pageNumber - 1) * filesPerPage;

    const sanitizedPath = this.sanitizePath(dir).join("/");
    const countFiles = this.db.prepare<SQLarFile["name"]>(
      "SELECT count(*) as total FROM sqlar WHERE name LIKE ?",
    );
    const files = this.db.prepare<{
      name: SQLarFile["name"];
      skip: typeof skip;
      filesPerPage: typeof filesPerPage;
    }>(
      `SELECT name, mode, datetime(mtime,'unixepoch') as mtime, sz FROM sqlar WHERE name LIKE :name ORDER BY ${orderBy} ${order} LIMIT :skip, :filesPerPage`,
    );

    const transaction = this.db.transaction(() => {
      const { total } = countFiles.get(`/${sanitizedPath}/%`) as {
        total: number;
      };
      const filesList = files.all({
        name: `/${sanitizedPath}/%`,
        skip,
        filesPerPage,
      }) as Array<Omit<SQLarFile, "data">>;
      return { totalFiles: total, filesList };
    })();

    return {
      files: transaction.filesList,
      totalFiles: transaction.totalFiles,
      currentPage: pageNumber,
      success: true,
    };
  }

  /**
   * Search files in the specified directory, if an empty array is provided, it will search in all directories.
   *
   * @param fileName - The file name.
   * @param dir - The directory path (can be and empty array '[]' to search in all directories).
   * @param filesPerPage - The number of files to retrieve per page. Default is 20.
   * @param pageNumber - The page number to retrieve. Default is 1.
   * @param orderBy - The field to order the files by. Valid values are "name", "mtime", or "sz". Default is "name".
   * @param order - The order in which to sort the files. Valid values are "ASC" or "DESC". Default is "ASC".
   * @returns An object containing the list of files, current page, total files and a success flag.
   */
  async searchFiles(
    fileName: string,
    dir: string[],
    filesPerPage: number = 20,
    pageNumber: number = 1,
    orderBy: "name" | "mtime" | "sz" = "name",
    order: "ASC" | "DESC" = "ASC",
  ) {
    const skip = pageNumber <= 1 ? 0 : (pageNumber - 1) * filesPerPage;

    let sanitizedPath = this.sanitizePath(dir).join("/");
    if (sanitizedPath === "") {
      sanitizedPath = "%";
    } else {
      sanitizedPath = `/${sanitizedPath}/%`;
    }

    const countFiles = this.db.prepare<SQLarFile["name"]>(
      "SELECT count(*) as total FROM sqlar WHERE name LIKE ?",
    );
    const files = this.db.prepare<{
      name: SQLarFile["name"];
      skip: typeof skip;
      filesPerPage: typeof filesPerPage;
    }>(
      `SELECT name, mode, datetime(mtime,'unixepoch') as mtime, sz FROM sqlar WHERE name LIKE :name ORDER BY ${orderBy} ${order} LIMIT :skip, :filesPerPage`,
    );

    const transaction = this.db.transaction(() => {
      const { total } = countFiles.get(`${sanitizedPath}${fileName}%`) as {
        total: number;
      };
      const filesList = files.all({
        name: `${sanitizedPath}${fileName}%`,
        skip,
        filesPerPage,
      }) as Array<Omit<SQLarFile, "data">>;
      return { totalFiles: total, filesList };
    })();

    return {
      files: transaction.filesList,
      totalFiles: transaction.totalFiles,
      currentPage: pageNumber,
      success: true,
    };
  }

  /**
   * Deletes all files from the storage.
   * @returns A promise that resolves to an object indicating the success of the operation.
   */
  async deleteAllFiles() {
    this.db.prepare("DELETE FROM sqlar").run();
    return { success: true };
  }

  /**
   * Deletes the files in the specified directory.
   *
   * @param dir - An array of directory names.
   * Example: ["root", "images"] | Delete all files in the '/root/images' directory.
   * @returns An object indicating the success of the operation.
   * If the directory is empty, it returns an error 'DirectoryAlreadyEmpty'.
   */
  async deleteDirectoryFiles(dir: string[]) {
    const sanitizedPath = this.sanitizePath(dir).join("/");
    if (sanitizedPath === "") {
      return {
        success: false,
        error: "DirectoryAlreadyEmpty",
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
export async function createSQLiteVault(
  databasePath: string,
): Promise<FileStorageManager> {
  const db = new BetterDatabase(databasePath, {
    fileMustExist: false,
  });

  const extensionPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "sqlar")
      : path.resolve("src", "sqlite-extensions", "sqlar");

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
