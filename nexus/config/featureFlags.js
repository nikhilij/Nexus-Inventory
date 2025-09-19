// Feature flag provider configuration
// Example with a simple object, could be replaced with a real provider like LaunchDarkly
export const featureFlags = {
   "new-dashboard-ui": {
      enabled: true,
      targeting: {
         users: ["user1@example.com"],
      },
   },
   "ai-forecasting": {
      enabled: false,
   },
};
