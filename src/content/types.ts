export type { ClaimLink, SourceReference } from './references';
export type { ContentRecord } from './schema';

import type { ContentRecord } from './schema';

export type ContentType = ContentRecord['type'];
export type PublicationStatus = ContentRecord['publicationStatus'];
export type ContentProvenance = ContentRecord['provenance'];
export type ContentReviewRecord = ContentRecord['reviewRecords'][number];
