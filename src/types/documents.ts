export type DocumentRecord = {
  id: string;
  file_name: string;
  storage_path: string;
  file_type: string | null;
  file_size: number | null;
  description?: string | null;
  renewal_instructions?: string | null;
  tags?: string[];
  category?: string | null;
  is_favorite?: boolean;
  expires_at: string | null;
  created_at: string;
};
