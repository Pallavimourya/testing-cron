// Test script to check plan name mapping
const plans = {
  zuper15: {
    name: "Starter",
    displayName: "Starter",
    price: "₹9",
    originalPrice: "₹9",
    duration: "15 days",
    durationDays: 15,
    imageLimit: 7,
    contentLimit: 30,
  },
  zuper30: {
    name: "Most Popular",
    displayName: "Most Popular",
    price: "₹799",
    originalPrice: "₹799",
    duration: "30 days",
    durationDays: 30,
    imageLimit: 15,
    contentLimit: 30,
  },
  zuper360: {
    name: "Professional",
    displayName: "Professional",
    price: "₹5,999",
    originalPrice: "₹5,999",
    duration: "360 days",
    durationDays: 360,
    imageLimit: 300,
    contentLimit: -1,
  },
}

// Test the logic
const userSubscriptionPlan = "zuper15"
const currentPlan = userSubscriptionPlan && plans[userSubscriptionPlan] 
  ? plans[userSubscriptionPlan] 
  : null

console.log("User subscription plan:", userSubscriptionPlan)
console.log("Current plan object:", currentPlan)
console.log("Display name:", currentPlan?.displayName || "Free")
console.log("Plan name:", currentPlan?.name || "Free")

// Test with different plans
console.log("\nTesting different plans:")
console.log("zuper15 ->", plans.zuper15?.displayName)
console.log("zuper30 ->", plans.zuper30?.displayName)
console.log("zuper360 ->", plans.zuper360?.displayName)
console.log("invalid ->", plans.invalid?.displayName || "Free")
