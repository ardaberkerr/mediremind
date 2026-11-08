import fs from "fs";
import path from "path";

/**
 * Thread-safe / asynchronous file lock helper for JSON database storage.
 * Ensures concurrent operations don't corrupt the JSON files.
 */
export class JsonFileStorage<T> {
  private filePath: string;
  private lock: Promise<void> = Promise.resolve();

  constructor(fileName: string) {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, fileName);
  }

  public async read(): Promise<T[]> {
    return this.withLock(async () => {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }
      try {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        return JSON.parse(raw) as T[];
      } catch (err) {
        console.error(`[JsonStorage] Error reading ${this.filePath}:`, err);
        return [];
      }
    });
  }

  public async write(data: T[]): Promise<void> {
    return this.withLock(async () => {
      // Atomic write using a temporary file
      const tempPath = `${this.filePath}.${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
      fs.renameSync(tempPath, this.filePath);
    });
  }

  public async update(modifier: (items: T[]) => T[] | Promise<T[]>): Promise<T[]> {
    return this.withLock(async () => {
      let items: T[] = [];
      if (fs.existsSync(this.filePath)) {
        try {
          const raw = fs.readFileSync(this.filePath, "utf-8");
          items = JSON.parse(raw) as T[];
        } catch {
          items = [];
        }
      }
      const newItems = await modifier(items);
      const tempPath = `${this.filePath}.${Date.now()}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(newItems, null, 2), "utf-8");
      fs.renameSync(tempPath, this.filePath);
      return newItems;
    });
  }

  private async withLock<R>(fn: () => Promise<R>): Promise<R> {
    let release: () => void;
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    const currentLock = this.lock;
    this.lock = (async () => {
      await currentLock;
      await nextLock;
    })();

    await currentLock;
    try {
      return await fn();
    } finally {
      release!();
    }
  }
}

export const usersStorage = new JsonFileStorage<any>("users.json");
export const medicationsStorage = new JsonFileStorage<any>("medications.json");
export const smsLogsStorage = new JsonFileStorage<any>("sms_logs.json");
export const pushStorage = new JsonFileStorage<any>("push_subscriptions.json");
