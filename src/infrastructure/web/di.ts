import { AddDocumentUseCase } from "@/core/use-cases/add-document-use-case";
import { DeleteDocumentUseCase } from "@/core/use-cases/delete-document-use-case";
import { GetDocumentUseCase } from "@/core/use-cases/get-document-use-case";
import { IndexDocumentsUseCase } from "@/core/use-cases/index-documents-use-case";
import { SearchUseCase } from "@/core/use-cases/search-use-case";
import { SuggestUseCase } from "@/core/use-cases/suggest-use-case";
import { AddSynonymGroupUseCase } from "@/core/use-cases/synonym/add-synonym-group-use-case";
import { DeleteSynonymUseCase } from "@/core/use-cases/synonym/delete-synonym-use-case";
import { ListSynonymsUseCase } from "@/core/use-cases/synonym/list-synonyms-use-case";
import { UpdateDocumentUseCase } from "@/core/use-cases/update-document-use-case";
import { InMemoryIndexRepository } from "../persistence/in-memory-index-repository";
import { InMemorySynonymRepository } from "../persistence/in-memory-synonym-repository";
import { MiniSearchProvider } from "../search/mini-search-provider";

// Persistence
export const indexRepository = new InMemoryIndexRepository();

// Search Provider
export const searchProvider = new MiniSearchProvider();

// Use Cases

// --- Instantiate Synonym Components ---
export const synonymRepository = new InMemorySynonymRepository();
export const addSynonymGroupUseCase = new AddSynonymGroupUseCase(
  synonymRepository
);
export const listSynonymsUseCase = new ListSynonymsUseCase(synonymRepository);
export const deleteSynonymUseCase = new DeleteSynonymUseCase(synonymRepository);

// --- Instantiate Index Components ---
export const indexDocumentsUseCase = new IndexDocumentsUseCase(
  indexRepository,
  searchProvider
);

// --- Instantiate Search Components ---
export const searchUseCase = new SearchUseCase(
  searchProvider,
  indexRepository,
  synonymRepository
);

// --- Instantiate Suggest Components ---
export const suggestUseCase = new SuggestUseCase(
  searchProvider,
  indexRepository
);

// Document Use Cases
export const addDocumentUseCase = new AddDocumentUseCase(
  indexRepository,
  searchProvider
);
export const getDocumentUseCase = new GetDocumentUseCase(indexRepository);
export const updateDocumentUseCase = new UpdateDocumentUseCase(
  indexRepository,
  searchProvider
);
export const deleteDocumentUseCase = new DeleteDocumentUseCase(
  indexRepository,
  searchProvider
);
