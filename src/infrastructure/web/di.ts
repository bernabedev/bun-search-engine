import { AddDocumentUseCase } from "@/core/use-cases/add-document-use-case";
import { DeleteDocumentUseCase } from "@/core/use-cases/delete-document-use-case";
import { GetDocumentUseCase } from "@/core/use-cases/get-document-use-case";
import { IndexDocumentsUseCase } from "@/core/use-cases/index-documents-use-case";
import { SearchUseCase } from "@/core/use-cases/search-use-case";
import { SuggestUseCase } from "@/core/use-cases/suggest-use-case";
import { UpdateDocumentUseCase } from "@/core/use-cases/update-document-use-case";
import { InMemoryIndexRepository } from "../persistence/in-memory-index-repository";
import { MiniSearchProvider } from "../search/mini-search-provider";

// Persistence
export const indexRepository = new InMemoryIndexRepository();

// Search Provider
export const searchProvider = new MiniSearchProvider();

// Use Cases
export const indexDocumentsUseCase = new IndexDocumentsUseCase(
  indexRepository,
  searchProvider
);
export const searchUseCase = new SearchUseCase(searchProvider, indexRepository);
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
