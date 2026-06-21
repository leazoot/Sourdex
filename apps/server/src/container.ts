import {
  CaptureRepository,
  ChunkRepository,
  createDb,
  createSqlite,
  ItemRepository,
  AiOutputRepository,
  JobRepository,
  ProviderConfigRepository,
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
import { EncryptedFileSecretStore } from "./infrastructure/security/encrypted-file-secret-store.js";
import { LocalStorage } from "./infrastructure/storage/local-storage.js";
import { JobWorker } from "./infrastructure/jobs/job-worker.js";
import { createExtractContentJob } from "./infrastructure/jobs/extract-content-job.js";
import { createGenerateSummaryJob } from "./infrastructure/jobs/generate-summary-job.js";
import { createGenerateEmbeddingJob } from "./infrastructure/jobs/generate-embedding-job.js";
import { CaptureService } from "./services/capture-service.js";
import { ItemService } from "./services/item-service.js";
import { SearchService } from "./services/search-service.js";
import { ExportService } from "./services/export-service.js";
import { ProviderConfigService } from "./services/provider-config-service.js";
import { SummaryService } from "./services/summary-service.js";
import { AutoTagService } from "./services/auto-tag-service.js";
import { EmbeddingService } from "./services/embedding-service.js";
import { SemanticSearchService } from "./services/semantic-search-service.js";
import { HybridSearchService } from "./services/hybrid-search-service.js";

/** Wired application dependencies (composition root). */
export interface Container {
  sqlite: SqliteDatabase;
  db: Db;
  itemRepo: ItemRepository;
  captureRepo: CaptureRepository;
  tagRepo: TagRepository;
  jobRepo: JobRepository;
  searchRepo: SearchRepository;
  providerConfigRepo: ProviderConfigRepository;
  aiOutputRepo: AiOutputRepository;
  captureService: CaptureService;
  itemService: ItemService;
  searchService: SearchService;
  exportService: ExportService;
  providerConfigService: ProviderConfigService;
  summaryService: SummaryService;
  embeddingService: EmbeddingService;
  semanticSearchService: SemanticSearchService;
  hybridSearchService: HybridSearchService;
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
  const providerConfigRepo = new ProviderConfigRepository(db);
  const aiOutputRepo = new AiOutputRepository(db);
  const chunkRepo = new ChunkRepository(db);

  const storage = new LocalStorage(config.dataDir);
  const secrets = new EncryptedFileSecretStore({ secretsPath: config.secretsPath });

  const captureService = new CaptureService({
    itemRepo,
    captureRepo,
    jobRepo,
    searchRepo,
    storage,
  });
  const itemService = new ItemService({
    itemRepo,
    captureRepo,
    tagRepo,
    searchRepo,
    aiOutputRepo,
    storage,
  });
  const searchService = new SearchService({ searchRepo });
  const exportService = new ExportService({ itemRepo, captureRepo, tagRepo, storage });
  const providerConfigService = new ProviderConfigService({ repo: providerConfigRepo, secrets });
  const autoTagService = new AutoTagService({ tagRepo, aiOutputRepo });
  const summaryService = new SummaryService({
    providerConfigRepo,
    secrets,
    aiOutputRepo,
    itemRepo,
    captureRepo,
    tagRepo,
    searchRepo,
    storage,
    autoTagService,
  });
  const embeddingService = new EmbeddingService({
    providerConfigRepo,
    secrets,
    chunkRepo,
    aiOutputRepo,
    itemRepo,
    captureRepo,
    storage,
  });
  const semanticSearchService = new SemanticSearchService({
    embeddingService,
    searchRepo,
    chunkRepo,
  });
  const hybridSearchService = new HybridSearchService({
    searchRepo,
    semanticSearchService,
    tagRepo,
  });

  const auth = new AuthService(loadOrCreateToken(config.tokenPath));

  const extractor = createExtractor();
  const worker = new JobWorker(jobRepo, { intervalMs: 1000 });
  worker.register(
    "extract_content",
    createExtractContentJob({ itemRepo, captureRepo, tagRepo, searchRepo, storage, extractor }),
  );
  worker.register("generate_summary", createGenerateSummaryJob(summaryService));
  worker.register("generate_embedding", createGenerateEmbeddingJob(embeddingService));

  return {
    sqlite,
    db,
    itemRepo,
    captureRepo,
    tagRepo,
    jobRepo,
    searchRepo,
    providerConfigRepo,
    aiOutputRepo,
    captureService,
    itemService,
    searchService,
    exportService,
    providerConfigService,
    summaryService,
    embeddingService,
    semanticSearchService,
    hybridSearchService,
    auth,
    worker,
    close: () => sqlite.close(),
  };
}
