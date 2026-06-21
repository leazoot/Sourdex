import {
  ExtractionError,
  type ContentExtractor,
  type ExtractInput,
  type ExtractResult,
  type ExtractStrategy,
  type SourceType,
} from "@sourdex/core";
import { WebpageExtractStrategy } from "./strategies/webpage.js";
import { SelectionExtractStrategy } from "./strategies/selection.js";

/** Dispatches extraction to a per-source-type strategy (Strategy pattern, PRD §10.3). */
class CompositeExtractor implements ContentExtractor {
  private readonly strategies = new Map<SourceType, ExtractStrategy>();

  constructor(strategies: ExtractStrategy[]) {
    for (const strategy of strategies) {
      this.strategies.set(strategy.sourceType, strategy);
    }
  }

  async extract(input: ExtractInput): Promise<ExtractResult> {
    const strategy = this.strategies.get(input.sourceType);
    if (!strategy) {
      throw new ExtractionError(`Unsupported source type: ${input.sourceType}`);
    }
    return strategy.extract(input);
  }
}

/**
 * Create the default content extractor (Factory, PRD §10.4). v0.1 supports `webpage`
 * and `selection`; pdf/video are reserved for later.
 */
export function createExtractor(): ContentExtractor {
  return new CompositeExtractor([new WebpageExtractStrategy(), new SelectionExtractStrategy()]);
}
