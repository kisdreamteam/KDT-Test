/**
 * Utility functions for detecting and managing icon files
 */

/**
 * Detects how many positive skill icons exist by trying to load them
 * Returns a promise that resolves to the count of available icons
 * Uses binary search approach for efficiency
 */
export async function detectAvailablePositiveIcons(maxIcons: number = 60): Promise<number> {
  // First, do a quick check in larger batches to find approximate range
  const quickBatchSize = 50;
  let approximateEnd = 0;
  
  // Quick scan to find approximate end
  for (let start = 1; start <= maxIcons; start += quickBatchSize) {
    const end = Math.min(start + quickBatchSize - 1, maxIcons);
    const promises = [];

    for (let i = start; i <= end; i++) {
      const iconPath = `/images/dashboard/award-points-icons/icons-positive/icon-pos-${i}.png`;
      promises.push(
        new Promise<boolean>((resolve) => {
          const img = new Image();
          const timeout = setTimeout(() => resolve(false), 1000); // 1 second timeout per image
          img.onload = () => {
            clearTimeout(timeout);
            resolve(true);
          };
          img.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
          };
          img.src = iconPath;
        })
      );
    }

    const results = await Promise.all(promises);
    const batchFound = results.filter(Boolean).length;

    if (batchFound > 0) {
      approximateEnd = end;
    } else if (approximateEnd > 0) {
      // Found range, now do detailed check
      break;
    }
  }

  if (approximateEnd === 0) {
    return 0; // No icons found
  }

  // Now do detailed check in the approximate range
  const detailedStart = Math.max(1, approximateEnd - quickBatchSize + 1);
  const detailedEnd = Math.min(approximateEnd + quickBatchSize, maxIcons);
  let lastFoundIndex = 0;

  for (let i = detailedStart; i <= detailedEnd; i++) {
    const iconPath = `/images/dashboard/award-points-icons/icons-positive/icon-pos-${i}.png`;
    const exists = await new Promise<boolean>((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => resolve(false), 1000);
      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
      img.src = iconPath;
    });

    if (exists) {
      lastFoundIndex = i;
    } else if (lastFoundIndex > 0) {
      // Found a gap after finding icons, we've reached the end
      break;
    }
  }

  return lastFoundIndex;
}

/**
 * Generates an array of positive icon paths up to the specified count
 */
export function generatePositiveIconPaths(count: number): string[] {
  return Array.from({ length: count }, (_, i) => 
    `/images/dashboard/award-points-icons/icons-positive/icon-pos-${i + 1}.png`
  );
}

/**
 * Generates an array of default positive icon paths (only first 5 icons)
 * Used for the 5 default positive point cards
 */
export function generateDefaultPositiveIconPaths(): string[] {
  return generatePositiveIconPaths(5);
}

/**
 * Generates an array of negative icon paths
 */
export function generateNegativeIconPaths(count: number = 7): string[] {
  return Array.from({ length: count }, (_, i) => 
    `/images/dashboard/award-points-icons/icons-negative/icon-neg-${i + 1}.png`
  );
}

/**
 * Normalizes icon paths by converting old icon paths to the new location
 * Converts /images/classes/icons/icon-pos-X.png to /images/dashboard/award-points-icons/icons-positive/icon-pos-X.png
 * Converts /images/classes/icons/icon-neg-X.png to /images/dashboard/award-points-icons/icons-negative/icon-neg-X.png
 */
export function normalizeIconPath(iconPath: string | null | undefined): string | undefined {
  if (!iconPath) return undefined;
  
  // If it's an old positive icon path, convert it to the new path
  if (iconPath.includes('/images/classes/icons/icon-pos-')) {
    const iconName = iconPath.split('/').pop(); // Get the filename (e.g., icon-pos-1.png)
    return `/images/dashboard/award-points-icons/icons-positive/${iconName}`;
  }
  
  // If it's an old negative icon path, convert it to the new path
  if (iconPath.includes('/images/classes/icons/icon-neg-')) {
    const iconName = iconPath.split('/').pop(); // Get the filename (e.g., icon-neg-1.png)
    return `/images/dashboard/award-points-icons/icons-negative/${iconName}`;
  }
  
  return iconPath;
}

