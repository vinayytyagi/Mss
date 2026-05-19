export { API_BASE, apiFetch, apiPost, withAuthHeaders } from "./api/apiClient";

export {
  fetchJourneySteps,
  fetchJourneyStep,
  fetchStepCategories,
  fetchItems,
  fetchItem,
  fetchItemVariants,
  fetchAttributeSchema,
} from "./api/catalogApi";

export { fetchHeroSlideshow } from "./api/siteSettingsApi";

export {
  requestUserOtp,
  verifyUserOtp,
  signupUser,
  progressiveSave,
  registerWithPhonePassword,
  loginUser,
  requestResetOtp,
  resetPassword,
} from "./api/authApi";

export { submitQuotationRequest, createShoppingOrder, verifyRazorpayPayment, trackOrder } from "./api/ordersApi";

export {
  fetchMyProfile,
  updateMyProfile,
  fetchMyOrders,
  cancelMyOrder,
  requestMyOrderRefund,
  restartMyJourney,
  deleteMyAccount,
} from "./api/userApi";

export { uploadOracleImage } from "./api/uploadApi";
