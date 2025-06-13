import useStore from './store'
import {queryLlm} from './llm'
import {queryPrompt} from './prompts'

const get = useStore.getState
const set = useStore.setState

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

export const sendQuery = async query => {
  set(state => {
    state.isFetching = true
    state.targetImage = null
    state.resetCam = true
    state.caption = null
  })
  try {
    const res = await queryLlm({prompt: queryPrompt(get().images, query)})
    try{
      const resJ = JSON.parse(res.replace('```json','').replace('```',''));
      set(state => {
        state.highlightNodes = resJ.filenames
        state.caption = resJ.commentary
      })
    }catch(e){
      console.error(e)
    }

  } finally {
    set(state => {
      state.isFetching = false
    })
  }
}

export const clearQuery = () =>
  set(state => {
    state.highlightNodes = null
    state.caption = null
    state.targetImage = null
  })

export const setTargetImage = async targetImage => {
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
