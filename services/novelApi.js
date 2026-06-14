import axios from 'axios';

/*
|--------------------------------------------------------------------------

BASE CLIENT CONFIG
*/

const api = axios.create({
baseURL: 'https://novel-api.nabaikabaiaguo.workers.dev',
timeout: 15000,
headers: {
'Content-Type': 'application/json',
Accept: 'application/json'
}
});

/*
|--------------------------------------------------------------------------

SIMPLE RETRY HELPER
*/

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestWithRetry = async (fn, retries = 2) => {
try {
return await fn();
} catch (err) {
if (retries > 0) {
await sleep(800);
return requestWithRetry(fn, retries - 1);
}
throw err;
}
};

/*
|--------------------------------------------------------------------------

ERROR NORMALIZER
*/

const normalizeError = (error) => {
if (error.response) {
return {
status: error.response.status,
message: error.response.data?.message || 'API Error',
data: error.response.data
};
}

if (error.code === 'ECONNABORTED') {
return {
status: 408,
message: 'Request timeout from Novel API'
};
}

return {
status: 500,
message: error.message || 'Unknown error'
};
};

/*
|--------------------------------------------------------------------------

NOVEL API SERVICE
*/

const novelApi = {
// SEARCH NOVELS
search: async ({ q, page = 1, limit = 20 }) => {
return requestWithRetry(async () => {
const res = await api.get('/search', {
params: {
q,
p: page,
l: limit
}
});

  return res.data;
});

},

// GENRE LISTING
getByGenre: async ({ id, page = 1, limit = 20, status, sort }) => {
return requestWithRetry(async () => {
const res = await api.get("/genre/${id}", {
params: {
p: page,
l: limit,
status,
sort
}
});

  return res.data;
});

},

// NOVEL DETAILS
getNovel: async (detailPath) => {
return requestWithRetry(async () => {
const res = await api.get("/novel/${detailPath}");
return res.data;
});
},

// CHAPTER LIST
getChapters: async ({ id, page = 1, limit = 50, order = 'ASC' }) => {
return requestWithRetry(async () => {
const res = await api.get('/chapters', {
params: {
id,
p: page,
l: limit,
order
}
});

  return res.data;
});

},

// SINGLE CHAPTER
getChapter: async (id) => {
return requestWithRetry(async () => {
const res = await api.get("/chapter/${id}");
return res.data;
});
},

// CHAPTER CONTENT (if needed)
getContent: async (path) => {
return requestWithRetry(async () => {
const res = await api.get("/content/${path}");
return res.data;
});
},

// RECOMMENDATIONS
getRecommendations: async ({ novelId, page = 1, limit = 10 }) => {
return requestWithRetry(async () => {
const res = await api.get('/recommend', {
params: {
id: novelId,
p: page,
l: limit
}
});

  return res.data;
});

},

// FEATURED
getFeatured: async ({ page = 1, limit = 20 } = {}) => {
return requestWithRetry(async () => {
const res = await api.get('/featured', {
params: {
p: page,
l: limit
}
});

  return res.data;
});

},

// RANKINGS
getRankings: async ({ rank = 1, page = 1, limit = 20 }) => {
return requestWithRetry(async () => {
const res = await api.get('/rankings', {
params: {
rank,
p: page,
l: limit
}
});

  return res.data;
});

},

// OPERATION CONTENT
getOperationContent: async ({ op, page = 1, limit = 20 }) => {
return requestWithRetry(async () => {
const res = await api.get('/operation/content', {
params: {
op,
p: page,
l: limit
}
});

  return res.data;
});

}
};

export default novelApi;
