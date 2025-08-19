/**
 * HeroUI Plugin Configuration
 */
import { CacheConfig } from "../../config/cache.config";

export const herouiCacheConfig: Partial<CacheConfig> = {
  repoUrl: "https://github.com/heroui-inc/heroui.git",
  repoBranch: "canary",
  cacheDirName: "heroui",
  sparseCheckoutPaths: [
    "apps/docs/content/docs",
    "apps/docs/content/components",
  ],
};
