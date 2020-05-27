import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import { AppThunk } from 'store/configureStore'

type FilterParams = {
  name: string
  value: string | boolean
}

interface IndicatorMessage {
  id: number,
  attributes: {
    name: string,
    risk_score: {
      available: boolean
      value: number
    },
    subject: string
    indicator_message_type: 'location' | 'country' | 'businesspartner'
    source: string
    created_at: string
  }
}

interface IndicatorMessagesState {
  error: string | null
  isLoading: boolean
  messages: Array<IndicatorMessage> | null
  filters: Array<FilterParams> | null
}

function startLoading(state: IndicatorMessagesState) {
  state.isLoading = true
}

function loadingFailed(state: IndicatorMessagesState, action: PayloadAction<string>) {
  state.error = action.payload
  state.isLoading = false
}

const initialState: IndicatorMessagesState = {
  error: null,
  isLoading: false,
  messages: null,
  filters: null
}

const indicatorMessages = createSlice({
  name: 'indicatorMessages',
  initialState,
  reducers: {
    getIndicatorMessagesStart: startLoading,
    getIndicatorMessagesSuccess(state, { payload }) {
      const { messages } = payload
      state.messages = messages
      state.isLoading = false
      state.error = null
    },
    getIndicatorMessagesFailure: loadingFailed,
    setFilters(state, { payload }) {
      const { filters } = payload
      state.filters = filters
    }
  }
})

export const {
  getIndicatorMessagesStart,
  getIndicatorMessagesSuccess,
  getIndicatorMessagesFailure,
  setFilters
} = indicatorMessages.actions

export default indicatorMessages.reducer

export const fetchIndicatorMessages = (
  token: string,
  filters?: Array<FilterParams>
): AppThunk => async dispatch => {
  try {
    if (filters) {
      dispatch(setFilters({ filters }))
    }

    const filterParams = filters && filters.reduce((acc, {name, value}) => {
      acc[`filter[${name}]`] = value
      return acc
    }, {} as {[key: string]: any})

    dispatch(getIndicatorMessagesStart())
    const { data: responseData } = await axios.get(
      'https://stagingapi.riskmethods.net/v2/indicator_messages?&fields[indicator_message]=name,subject,country,source,risk_score,indicator,indicator_message_type,read_more_url,created_at&page[size]=20', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        ...filterParams
      }
    })
    dispatch(getIndicatorMessagesSuccess({
      messages: responseData.data
    }))
  } catch (err) {
    dispatch(getIndicatorMessagesFailure(err.toString()))
  }
}