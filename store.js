import 'immer'
import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {createSelectorFunctions} from 'auto-zustand-selectors-hook'

export default createSelectorFunctions(
  create(
    immer(() => ({
      didInit: false,
      images: null,
      layout: 'sphere',
      layouts: null,
      nodePositions: null,
      highlightNodes: null,
      isFetching: false,
      targetImage: null,
      caption: null,
      resetCam: false,
    }))
  )
)
