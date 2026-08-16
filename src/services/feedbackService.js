import { useMutation, useQuery } from "@tanstack/react-query";
import axiosInstance from "../config/axios";
import { enqueueSnackbar } from "notistack";

export const submitParentFeedback = async (payload) => {
  const response = await axiosInstance.post("/feedback/submit", payload);
  return response.data;
};

export const getParentFeedbackList = async (params = {}) => {
  const response = await axiosInstance.get("/feedback/admin", { params });
  return response.data;
};

export const useSubmitParentFeedbackMutation = (options = {}) =>
  useMutation({
    mutationFn: submitParentFeedback,
    onSuccess: (data, variables, context) => {
      enqueueSnackbar(
        data?.message || "આભાર! તમારી રજૂઆત / ફીડબેક સબમિટ થઈ ગઈ છે.",
        { variant: "success" },
      );
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          "રજૂઆત / ફીડબેક સબમિટ થઈ શકી નહીં. ફરી પ્રયાસ કરો.",
        { variant: "error" },
      );
      options.onError?.(error, variables, context);
    },
  });

export const useGetParentFeedbackListQuery = (params = {}, enabled = true) =>
  useQuery({
    queryKey: ["admin", "parent-feedback", params.page, params.limit, params.search],
    queryFn: () => getParentFeedbackList(params),
    enabled,
    staleTime: 60 * 1000,
  });
