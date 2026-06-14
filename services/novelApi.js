import axios from 'axios';

/*
|--------------------------------------------------------------------------
| BASE CLIENT
|--------------------------------------------------------------------------
*/

const api = axios.create({
  baseURL: 'https://novel-api.nabaikabaiaguo.workers.dev',
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const requestWithRetry = async (
  fn,
  retries = 2
) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await sleep(1000);
      return requestWithRetry(fn, retries - 1);
    }

    throw normalizeError(error);
  }
};

const normalizeError = (error) => {
  if (error.response) {
    return new Error(
      error.response.data?.message ||
        `Novel API Error (${error.response.status})`
    );
  }

  if (error.code === 'ECONNABORTED') {
    return new Error('Novel API request timeout');
  }

  return new Error(
    error.message || 'Unknown Novel API error'
  );
};

/*
|--------------------------------------------------------------------------
| NOVEL API SERVICE
|--------------------------------------------------------------------------
*/

const novelApi = {
  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */
  async search({ q, page = 1, limit = 20 }) {
    return requestWithRetry(async () => {
      const { data } = await api.get('/search', {
        params: {
          q,
          p: page,
          l: limit
        }
      });

      return data;
    });
  },

  /*
  |--------------------------------------------------------------------------
  | NOVEL DETAILS
  |--------------------------------------------------------------------------
  */
  async getNovel(detailPath) {
    return requestWithRetry(async () => {
      const { data } = await api.get(
        `/novel/${detailPath}`
      );

      return data;
    });
  },

  /*
  |--------------------------------------------------------------------------
  | CHAPTER LIST
  |--------------------------------------------------------------------------
  */
  async getChapters({
    id,
    page = 1,
    limit = 50,
    order = 'ASC'
  }) {
    return requestWithRetry(async () => {
      const { data } = await api.get('/chapters', {
        params: {
          id,
          p: page,
          l: limit,
          order
        }
      });

      return data;
    });
  },

  /*
  |--------------------------------------------------------------------------
  | SINGLE CHAPTER
  |--------------------------------------------------------------------------
  */
  async getChapter(id) {
    return requestWithRetry(async () => {
      const { data } = await api.get(
        `/chapter/${id}`
      );

      return data;
    });
  },

  /*
  |--------------------------------------------------------------------------
  | CHAPTER CONTENT
  |--------------------------------------------------------------------------
  */
  async getContent(path) {
    return requestWithRetry(async () => {
      const { data } = await api.get(
        `/content/${path}`
      );

      return data;
    });
  },

  /*
  |--------------------------------------------------------------------------
  | FEATURED
  |--------------------------------------------------------------------------
  */
  async getFeatured({
    page = 1,
    limit = 20
  } = {}) {
    return requestWithRetry(async () => {
      const { data } = await api.get('/featured', {
        params: {
          p: page,
          l: limit
        }
      });

      return data;
    });
  },

  /*
  |--------------------------------------------------------------------------
  | RANKINGS
  |--------------------------------------------------------------------------
  */
  async getRankings({
    rank = 1,
    page = 1,
    limit = 20
  }) {
    return requestWithRetry(async () => {
      const { data } = await api.get('/rankings', {
        params: {
          rank,
          p: page,
          l: limit
        }
      });

      return data;
    });
  },

  /*
  |--------------------------------------------------------------------------
  | RECOMMENDATIONS
  |--------------------------------------------------------------------------
  */
  async getRecommendations({
    novelId,
    page = 1,
    limit = 10
  }) {
    return requestWithRetry(async () => {
      const { data } = await api.get('/recommend', {
        params: {
          id: novelId,
          p: page,
          l: limit
        }
      });

      return data;
    });
  },

  /*
  |--------------------------------------------------------------------------
  | GENRE
  |--------------------------------------------------------------------------
  */
  async getByGenre({
    id,
    page = 1,
    limit = 20,
    status,
    sort
  }) {
    return requestWithRetry(async () => {
      const { data } = await api.get(
        `/genre/${id}`,
        {
          params: {
            p: page,
            l: limit,
            status,
            sort
          }
        }
      );

      return data;
    });
  },

  /*
  |--------------------------------------------------------------------------
  | OPERATION CONTENT
  |--------------------------------------------------------------------------
  */
  async getOperationContent({
    op,
    page = 1,
    limit = 20
  }) {
    return requestWithRetry(async () => {
      const { data } = await api.get(
        '/operation/content',
        {
          params: {
            op,
            p: page,
            l: limit
          }
        }
      );

      return data;
    });
  }
};

export default novelApi;
