import fs from "node:fs/promises";

export async function databaseExists(databasePath: string): Promise<boolean> {
  try {
    await fs.access(databasePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}
