"use client";

import { useQueryClient } from "@tanstack/react-query";
import DocumentUploadBox from "@/components/documents/DocumentUploadBox";
import DocumentManager from "@/components/documents/DocumentManager";
import { documentsQueryKey } from "@/hooks/useDocumentsQuery";
import type { DocumentRecord } from "@/types/documents";

export default function DashboardDocuments() {
  const queryClient = useQueryClient();

  return (
    <>
      <div className="mt-8">
        <DocumentUploadBox
          onUploaded={(document) => {
            queryClient.setQueryData<DocumentRecord[]>([...documentsQueryKey, "all"], (current = []) => [document as DocumentRecord, ...current]);
          }}
        />
      </div>

      <div className="mt-8">
        <DocumentManager
          initialDocuments={[]}
          title="Recent documents"
          showUpload={false}
          showSearch={false}
          showFilters={false}
          maxDocuments={10}
          viewMoreHref="/documents"
        />
      </div>
    </>
  );
}
