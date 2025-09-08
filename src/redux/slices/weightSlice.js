import { createSlice } from "@reduxjs/toolkit";

const weightSlice = createSlice({
  name: "weight",
  initialState: {
    value: 0, // default weight
  },
  reducers: {
    setWeight: (state, action) => {
      state.value = action.payload;
    },
  },
});

export const { setWeight } = weightSlice.actions;
export default weightSlice.reducer;
