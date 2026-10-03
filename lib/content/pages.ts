import { cache } from "react";
import { FileRepository } from "./repository";

/** The repository used at build time. Swap this export to change the content source. */
export const pageRepository = new FileRepository();

/** Memoised per request/render so `generateMetadata` and the page share one read. */
export const getPage = cache((slug: string) => pageRepository.get(slug));
export const listPages = cache(() => pageRepository.list());
export const listSlugs = cache(() => pageRepository.slugs());
