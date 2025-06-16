import useStore from './store'
import { queryLlm } from './llm'
import { queryPrompt } from './prompts'

const get = useStore.getState
const set = useStore.setState

// Debounce utility fonksiyonu
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Cache için Map kullan
const queryCache = new Map();

export const init = async () => {
  if (get().didInit) {
    return
  }

  set(state => {
    state.didInit = true
  })

  const [images, sphere, umapGrid] = await Promise.all(
    ['meta', 'sphere', 'umap-grid'].map(
      path => fetch(path + '.json').then(res => res.json())
    )
  )

  set(state => {
    state.images = images
    state.layouts = {
      sphere,
      grid: Object.fromEntries(
        Object.entries(umapGrid).map(([k, [x, y]]) => [
          k,
          [x, y / (16 / 9) + 0.25]
        ])
      )
    }
    state.nodePositions = Object.fromEntries(
      images.map(({id}) => [id, [0.5, 0.5, 0.5]])
    )
  })

  setLayout('sphere')
}

export const setLayout = layout =>
  set(state => {
    state.layout = layout
    state.nodePositions = state.layouts[layout]
  })

export const setSphereLayout = positions =>
  set(state => {
    state.layouts.sphere = positions
  })

// Debounced query function - optimize edilmiş
const debouncedSendQuery = debounce(async (query) => {
  const state = get();
  
  // Cache kontrolü
  const cacheKey = query.toLowerCase().trim();
  if (queryCache.has(cacheKey)) {
    const cachedResult = queryCache.get(cacheKey);
    set(state => {
      state.highlightNodes = cachedResult.highlightNodes;
      state.caption = cachedResult.caption;
      state.isFetching = false;
    });
    return;
  }

  if (!state.images) {
    console.warn('No images available for query');
    set(state => {
      state.isFetching = false;
    });
    return;
  }

  try {
    const res = await queryLlm({prompt: queryPrompt(state.images, query)});
    
    try {
      const resJ = JSON.parse(res.replace('```json','').replace('```',''));
      
      const result = {
        highlightNodes: resJ.filenames || [],
        caption: resJ.commentary || `"${query}" için sonuç bulunamadı`
      };
      
      // Sonucu cache'le
      queryCache.set(cacheKey, result);
      
      set(state => {
        state.highlightNodes = result.highlightNodes;
        state.caption = result.caption;
        state.isFetching = false;
      });
      
    } catch(parseError) {
      console.error('JSON parse error:', parseError);
      set(state => {
        state.caption = `"${query}" için sonuç işlenirken hata oluştu`;
        state.highlightNodes = null;
        state.isFetching = false;
      });
    }

  } catch (error) {
    console.error('Query processing error:', error);
    set(state => {
      state.caption = `Arama sırasında hata oluştu: ${error.message}`;
      state.highlightNodes = null;
      state.isFetching = false;
    });
  }
}, 300); // 300ms debounce

export const sendQuery = (query) => {
  if (!query || query.trim().length === 0) {
    return;
  }

  set(state => {
    state.isFetching = true;
    state.caption = `"${query}" aranıyor...`;
    state.targetImage = null;
    state.resetCam = true;
  });

  debouncedSendQuery(query);
};

export const clearQuery = () =>
  set(state => {
    state.highlightNodes = null
    state.caption = null
    state.targetImage = null
  })

export const setTargetImage = (targetImage) => {
  if (targetImage === get().targetImage) {
    targetImage = null
  }

  set(state => {
    state.targetImage = targetImage
    state.isFetching = !!targetImage
    state.highlightNodes = null
  })

  if (!targetImage) {
    return
  }

  set(state => {
    state.isFetching = false
  })
}

init()
