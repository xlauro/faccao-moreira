import Constants from 'expo-constants';

export interface VersionInfo {
  latestVersion: string;
  versionCode?: number;
  apkUrl: string;
  forceUpdate?: boolean;
  releaseNotes?: string;
}

export const DEFAULT_UPDATE_URL = 'http://163.176.224.111/version.json';

/**
 * Obtém a versão atual do app instalada no dispositivo.
 */
export function getCurrentVersion(): string {
  return Constants.expoConfig?.version || '1.0.0';
}

/**
 * Compara duas strings de versão no formato semver (ex: "1.0.0" vs "1.1.0").
 * Retorna:
 *  -1 se v1 < v2 (v2 é mais recente)
 *   1 se v1 > v2 (v1 é mais recente)
 *   0 se forem iguais
 */
export function compareVersions(v1: string, v2: string): number {
  const cleanV1 = v1.replace(/^v/i, '').trim();
  const cleanV2 = v2.replace(/^v/i, '').trim();

  const parts1 = cleanV1.split('.').map((p) => parseInt(p.split('-')[0], 10) || 0);
  const parts2 = cleanV2.split('.').map((p) => parseInt(p.split('-')[0], 10) || 0);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }

  return 0;
}

/**
 * Verifica se a versão remota é mais recente que a versão atual instalada.
 */
export function isVersionNewer(currentVersion: string, latestVersion: string): boolean {
  return compareVersions(currentVersion, latestVersion) < 0;
}

/**
 * Busca as informações da versão mais recente no servidor remoto.
 */
export async function fetchLatestVersionInfo(url: string = DEFAULT_UPDATE_URL): Promise<VersionInfo | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[UpdateService] Erro de status HTTP: ${response.status}`);
      return null;
    }

    const data: VersionInfo = await response.json();
    return data;
  } catch (error) {
    console.warn('[UpdateService] Falha de rede ao buscar informações de atualização:', error);
    return null;
  }
}
