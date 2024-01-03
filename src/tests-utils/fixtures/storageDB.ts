import { type FileStorageManager } from "../../FileStorageManager.ts";

const state = {
  storageManager: {},
};

const getStorageManagerState = () => state.storageManager;

const setStorageManagerState = (storageManager: FileStorageManager) => {
  state.storageManager = storageManager;
};

export { getStorageManagerState, setStorageManagerState };
