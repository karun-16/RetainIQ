import { PredictRequest, PredictResponse, InterventionRequest, InterventionResponse } from './types';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function buildUrl(path: string): string {
  try {
    // Remove trailing slash from base if present, and remove leading slash from path
    const base = RAW_API_URL.trim().replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return new URL(`${base}/${cleanPath}`).toString();
  } catch (e) {
    console.error('Failed to construct API URL', e);
    // Fallback if URL parsing fails
    return `${RAW_API_URL}/${path.replace(/^\/+/, '')}`;
  }
}
/** Extracts a human-readable error message from FastAPI error responses */
function extractErrorMessage(errorData: any, fallback: string): string {
  if (!errorData) return fallback;
  const detail = errorData.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    // FastAPI 422 validation errors: [{loc, msg, type}, ...]
    return detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join('; ') || fallback;
  }
  return fallback;
}

export async function fetchCategories() {
  const url = buildUrl('/categories');
  const response = await fetch(url).catch(e => {
    throw new Error(`Failed to execute fetch() to ${url}: ${e.message}`);
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }
  return response.json();
}

export async function runPrediction(data: PredictRequest): Promise<PredictResponse> {
  const url = buildUrl('/predict');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).catch(e => {
    throw new Error(`Failed to execute fetch() to ${url}: ${e.message}`);
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      throw new Error(`Failed to run prediction: ${response.statusText}`);
    }
    throw new Error(extractErrorMessage(errorData, 'Failed to run prediction'));
  }

  return response.json();
}

export async function runWhatIf(data: PredictRequest) {
  const url = buildUrl('/whatif');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).catch(e => {
    throw new Error(`Failed to execute fetch() to ${url}: ${e.message}`);
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      throw new Error(`Failed to run what-if scenario: ${response.statusText}`);
    }
    throw new Error(extractErrorMessage(errorData, 'Failed to run what-if scenario'));
  }

  return response.json();
}

export async function runInterventions(data: PredictRequest): Promise<InterventionResponse> {
  const req: InterventionRequest = { employee_data: data };
  const url = buildUrl('/interventions');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req),
  }).catch(e => {
    throw new Error(`Failed to execute fetch() to ${url}: ${e.message}`);
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      throw new Error(`Failed to simulate interventions: ${response.statusText}`);
    }
    throw new Error(extractErrorMessage(errorData, 'Failed to simulate interventions'));
  }

  return response.json();
}
