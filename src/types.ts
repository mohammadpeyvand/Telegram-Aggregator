export type ActiveTab = 'migration' | 'files' | 'guide' | 'env';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: string;
  description: string;
  downloadUrl: string;
  badge: string;
}
