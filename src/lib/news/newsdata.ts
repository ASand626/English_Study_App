import "server-only";

const BASE_URL = "https://newsdata.io/api/1";

export interface NewsArticle {
  title: string;
  link: string;
  bodyText: string;
}

interface NewsdataArticle {
  title: string;
  link: string;
  description: string | null;
  content: string | null;
}

interface NewsdataResponse {
  status: string;
  results: NewsdataArticle[] | null;
}

async function fetchArticles(endpoint: "news" | "crypto", params: Record<string, string>): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) throw new Error("NEWSDATA_API_KEY is not set");

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("language", "en");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`newsdata.io request failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as NewsdataResponse;
  if (data.status !== "success") {
    throw new Error(`newsdata.io returned an error response: ${JSON.stringify(data)}`);
  }

  // On the free plan, `content` (full body) is never real text — it's
  // always literally the string below — so `description` (a 1-2 sentence
  // teaser) is the only usable source text. Articles with no usable
  // description at all are dropped; a short lesson from a short teaser is
  // fine, but zero source text is not.
  return (data.results ?? [])
    .map((article) => {
      const content = article.content && article.content !== PAYWALLED_CONTENT_MARKER ? article.content : null;
      return {
        title: article.title,
        link: article.link,
        bodyText: content || article.description || "",
      };
    })
    .filter((article) => article.bodyText.trim().length >= MIN_BODY_LENGTH);
}

const PAYWALLED_CONTENT_MARKER = "ONLY AVAILABLE IN PAID PLANS";
const MIN_BODY_LENGTH = 40;

export function fetchBusinessNews(): Promise<NewsArticle[]> {
  return fetchArticles("news", { category: "business,top" });
}

export function fetchCryptoNews(): Promise<NewsArticle[]> {
  return fetchArticles("crypto", {});
}
