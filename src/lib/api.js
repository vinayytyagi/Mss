export { API_BASE, apiFetch, apiPost, withAuthHeaders } from "./api/apiClient";

export {
  fetchJourneySteps,
  fetchJourneyStep,
  fetchStepCategories,
  fetchItems,
  fetchItem,
  fetchItemVariants,
  fetchAttributeSchema,
  fetchPackageDefinition,
} from "./api/catalogApi";

export { fetchHeroSlideshow, fetchSiteConfig } from "./api/siteSettingsApi";

export { fetchBudgetPresets } from "./api/budgetPresetsApi";

export {
  requestUserOtp,
  verifyUserOtp,
  signupUser,
  progressiveSave,
  registerWithPhonePassword,
  loginUser,
  requestResetOtp,
  resetPassword,
  googleAuth,
  completeGooglePhone,
} from "./api/authApi";

export {
  submitQuotationRequest,
  createShoppingOrder,
  validateCheckoutCoupon,
  verifyRazorpayPayment,
  trackOrder,
  retryOrderPayment,
  fetchMyOrder,
} from "./api/ordersApi";

export {
  fetchMyProfile,
  updateMyProfile,
  fetchMyOrders,
  fetchMyQuotations,
  fetchMyQuotation,
  fetchMyServiceOrders,
  fetchMyServiceOrder,
  approveServiceQuote,
  confirmServiceDelivery,
  getServiceBalanceLink,
  cancelMyOrder,
  requestMyOrderRefund,
  restartMyJourney,
  deleteMyAccount,
  fetchMyCredit,
  createWalletTopupOrder,
  verifyWalletTopupPayment,
  fetchMyReturnRequests,
  createItemReturnRequest,
  confirmReturnPayment,
} from "./api/userApi";

export { uploadOracleImage } from "./api/uploadApi";
