import {
  CaptureRepository,
  createDb,
  createSqlite,
  ItemRepository,
  JobRepository,
  runMigrations,
  SearchRepository,
  TagRepository,
  type Db,
  type SqliteDatabase,
} from "@sourdex/db";
import { createExtractor } from "@sourdex/extractor";
import type { ServerConfig } from "./config.js";
import { ensureDataDirs } from "./paths.js";
import { AuthService, loadOrCreateToken } from "./infrastructure/security/auth.js";
import { LocalStorage } from "./infrastructure/storage/local-storage.js";
import { JobWorker } from "./infrastructure/jobs/job-worker.js";
import { createExtractContentJob } from "./infrastructure/jobs/extract-content-job.js";
import { CaptureService } from "./services/capture-service.js";
import { ItemService } from "./services/item-service.js";
import { SearchService } from "./services/search-service.js";
import { ExportService } from "./services/export-service.js";

/** Wired application dependencies (composition root). */
export interface Container {
  sqlite: SqliteDatabase;
  db: Db;
  itemRepo: ItemRepository;
  captureRepo: CaptureRepository;
  tagRepo: TagRepository;
  jobRepo: JobRepository;
  searchRepo: SearchRepository;
  captureService: CaptureService;
  itemService: ItemService;
  searchService: SearchService;
  exportService: ExportService;
  auth: AuthService;
  worker: JobWorker;
  /** Close underlying resources (DB handle). */
  close(): void;
}

/**
 * Build the dependency graph: ensure data dirs, open+migrate the database, construct
 * repositories, storage, services and the job worker. The worker is created but not
 * started here (the server entrypoint starts it; tests leave it stopped).
 */
export function createContainer(config: ServerConfig): Container {
  ensureDataDirs(config.dataDir);

  const sqlite = createSqlite(config.dbPath);
  runMigrations(sqlite);
  const db = createDb(sqlite);

  const itemRepo = new ItemRepository(db);
  const captureRepo = new CaptureRepository(db);
  const tagRepo = new TagRepository(db);
  const jobRepo = new JobRepository(db);
  const searchRepo = new SearchRepository(db);

  const storage = new LocalStorage(config.dataDir);

  const captureService = new CaptureService({
    itemRepo,
    captureRepo,
    jobRepo,
    searchRepo,
    storage,
  });
  const itemService = new ItemService({ itemRepo, captureRepo, tagRepo, searchRepo, storage });
  const searchService = new SearchService({ searchRepo });
  const exportService = new ExportService({ itemRepo, captureRepo, tagRepo, storage });

  const auth = new AuthService(loadOrCreateToken(config.tokenPath));

  const extractor = createExtractor();
  const worker = new JobWorker(jobRepo, { intervalMs: 1000 });
  worker.register(
    "extract_content",
    createExtractContentJob({ itemRepo, captureRepo, tagRepo, searchRepo, storage, extractor }),
  );

  return {
    sqlite,
    db,
    itemRepo,
    captureRepo,
    tagRepo,
    jobRepo,
    searchRepo,
    captureService,
    itemService,
    searchService,
    exportService,
    auth,
    worker,
    close: () => sqlite.close(),
  };
}
