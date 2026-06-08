export function timeoutPromise(seconds) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request took too long")), seconds * 1000);
  });
}

export async function fetchJson(url, options = {}, timeoutMs = 10000) {
  const response = await fetchWithTimeout(url, options, timeoutMs);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

export async function fetchWithTimeout(url, options, timeoutMs, parentSignal) {
  const controller = new AbortController();
  const onParentAbort = () => controller.abort();
  parentSignal?.addEventListener("abort", onParentAbort);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (parentSignal?.aborted) throw err;
    if (controller.signal.aborted) {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    parentSignal?.removeEventListener("abort", onParentAbort);
  }
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
