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

export { fetchBlogs, fetchBlog, fetchHomepageBlogs } from "./api/blogsApi";

export { fetchBudgetPresets } from "./api/budgetPresetsApi";

export {
  requestUserOtp,
  verifyUserOtp,
  signupUser,
  progressiveSave,
  registerWithPhonePassword,
  loginUser,
  requestPasswordResetLink,
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

export { syncCartSnapshot, markCartConverted } from "./api/cartSyncApi";
