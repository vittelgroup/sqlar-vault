<h1 align="center">
  <br>
  📦 SQLar Vault
  <br>
</h1>

<h4 align="center">A package for file management and storage in SQLite3</h4>

<p align="center">
  🚧 Not ready to be used in production, APIs are subject to change
</p>

<p align="center">
  <a href="#about">About</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api">API</a> •
  <a href="#prerequisites">Prerequisites</a> •
  <a href="#installing-and-running">Installing and Running</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a> •
  <a href="#acknowledgments">Acknowledgments</a>
</p>

## About

It's a simple library for storing files in SQLite using the [SQLar](https://sqlite.org/sqlar.html) extension.

An <b>SQLite Archive</b> is a file container similar to a ZIP archive or Tarball but based on an SQLite database, is a single file on disk that can be used to store multiple kind of files, and it is [faster ⚡](https://www.sqlite.org/fasterthanfs.html#summary) than the file system!

## Key Features

- Simple
  - Only one SQLite archive containing all files
  - API easy to use
  - Easy to backup, just copy and paste the SQLite archive.
- Fast
  - ~35% faster reads and writes than the file system (for small blobs)
  - In a real world scenario it can be [twice as fast as the file system](https://github.com/chrisdavies/dbench)
- Atomic and Durable
  - The insert | update | delete in SQLite can be transactional, mantaining a consistent version of the content.
  - Individual files can be added or removed or replaced without having to rewrite the entire archive.

## Getting Started

Install from NPM using your package manager

```
npm install sqlar-vault
```

```
yarn add sqlar-vault
```

```
pnpm i sqlar-vault
```

Import <b>createSQLiteVault()</b>

```javascript
import { createSQLiteVault } from "./FileStorageManager.ts";
// createSQLiteVault accept the database name as a parameter (the sqlite filename)
const storage = await createSQLiteVault('my-storage.sqlar');
// get the file as a Blob|Buffer from somewhere
const file = request.file...
// store the file in a virtual directory in sqlite, passing the path as an string array
const {
    success,
    error,
    fileName,
    fileNameWithPath } = await storage.storeFile(["root", "pdf"], "my_pdf_file.pdf", file);

// retrieve a file passing the directory and its name
const { success, file } = await storage.retrieveFile(
    ["root", "pdf"],
    fileName,
);

```

## API

All methods available for managing files in the SQlar storage file

```typescript
 /**
   * Retrieves the total number of files stored in the database.
   * @returns An object containing the total number of files.
   */
  async getTotalFiles();

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
  );

  /**
   * Retrieves a file from the storage based on the specified directory and file name.
   * @param dir - The directory path of the file.
   * Example: ["root", "images", "profile"]
   * @param fileName - The name of the file.
   * Example: "profile.jpeg"
   * @returns A promise that resolves to an object containing the success status and the retrieved file, if successful.
   * If the file is not found, it returns an error 'FileNotFound'.
   */
  async retrieveFile(dir: string[], fileName: string);

  /**
   * Deletes a file from the storage.
   * @param dir - The directory path where the file is located.
   * Example: ["root", "images", "profile"]
   * @param fileName - The name of the file to be deleted.
   * Example: "profile.jpeg"
   * @returns An object indicating the success of the operation.
   * If the file is not found, it returns an error 'FileNotFound'.
   */
  async deleteFile(dir: string[], fileName: string);

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
  );

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
  );

  /**
   * Deletes all files from the storage.
   * @returns A promise that resolves to an object indicating the success of the operation.
   */
  async deleteAllFiles();

 /**
   * Deletes the files in the specified directory.
   *
   * @param dir - An array of directory names.
   * Example: ["root", "images"] | Delete all files in the '/root/images' directory.
   * @returns An object indicating the success of the operation.
   * If the directory is empty, it returns an error 'DirectoryAlreadyEmpty'.
   */
  async deleteDirectoryFiles(dir: string[]);
```

## Prerequisites

- npm
- sqlite3

This package already comes with the <b>sqlar.so</b> extension

## Installing and Running

```bash
# Clone this repository
$ git clone https://github.com/vittelgroup/sqlar-vault

# Go into the repository
$ cd sqlar-vault
```

## Contributing

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the project
2. Clone it open the repository in command line
3. Create your feature branch (`git checkout -b feature/amazing-feature`)
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a pull request from your feature branch from your repository into this repository main branch, and provide a description of your changes

## License

[MIT license](license.txt)

## Acknowledgments

Tools and libs used in this project

- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3/)
- [sqlite3](https://sqlite.org/sqlar.html)
- [typescript](https://www.typescriptlang.org)
- [vitest](https://vitest.dev)
- [esbuild](https://esbuild.github.io)
- [tsx](https://github.com/privatenumber/tsx)

---
