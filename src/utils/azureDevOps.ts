const ORG = "JPL-JioMart";
const PROJECT = "Retailer and Distribution Platform";
const API_VERSION = "7.0-preview.3";
const COMMENTS_ENDPOINT = (adoId: string) =>
  `https://dev.azure.com/${encodeURIComponent(ORG)}/${encodeURIComponent(PROJECT)}/_apis/wit/workItems/${adoId}/comments?api-version=${API_VERSION}`;

const getAuthHeader = () => {
  const pat = import.meta.env.VITE_AZURE_PAT || "REPLACE_WITH_P.A.T";
  if (!pat || pat.startsWith("REPLACE_WITH")) {
    throw new Error("Azure PAT is not configured. Please set VITE_AZURE_PAT.");
  }
  return `Basic ${btoa(`:${pat}`)}`;
};

export const postChangelogToAdo = async (adoId: string, changelog: string) => {
  if (!adoId || !changelog?.trim()) {
    return;
  }

  const response = await fetch(COMMENTS_ENDPOINT(adoId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      text: changelog,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Azure DevOps API error (${response.status}): ${errorBody}`);
  }
};


