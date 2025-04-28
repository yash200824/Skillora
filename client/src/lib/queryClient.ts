import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = "";
    try {
      // First try to parse response as JSON
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
    } catch (e) {
      // If it's not JSON, get it as text
      try {
        errorMessage = await res.text();
      } catch (e2) {
        // Fallback to status text if text parsing fails
        errorMessage = res.statusText;
      }
    }
    console.error(`API error (${res.status}):`, errorMessage);
    throw new Error(errorMessage || `Request failed with status ${res.status}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`Making ${method} request to ${url}`, data ? { data } : '');
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Include credentials for cross-origin requests (cookies)
  });

  if (!res.ok) {
    console.error(`Request failed: ${method} ${url}`, res.status, res.statusText);
  } else {
    console.log(`Request successful: ${method} ${url}`, res.status);
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    console.log(`Making query request to ${url}`);
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (res.status === 401) {
      console.log(`Authentication error (401) for ${url}`, unauthorizedBehavior === "returnNull" ? "- returning null" : "- throwing error");
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
    }

    if (!res.ok) {
      console.error(`Query failed: GET ${url}`, res.status, res.statusText);
    } else {
      console.log(`Query successful: GET ${url}`, res.status);
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
