const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "")

async function getJson(path, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  })

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  return response.json()
}

export async function loadApplicationData(signal) {
  const [bootstrap, screens] = await Promise.all([
    getJson("/bootstrap", signal),
    getJson("/screens", signal),
  ])

  return {
    ...bootstrap,
    screensHtml: screens.html,
  }
}

export { API_BASE_URL }
