const enTranslations = {
  app_name: "DigiDairy",
  hero: {
    loading_session: "Loading session...",
    tagline: "Your journey starts here",
    signin_button: "Sign In",
    signup_button: "Sign Up",
  },
  carousel: {
    slide1_title: "Effortless Calculations",
    slide1_desc:
      "Say goodbye to notebooks! Calculate daily milk records, feed expenses, and income quickly and accurately.",
    slide2_title: "Affordable Subscriptions",
    slide2_desc:
      "For the price of a small notebook, get a month of worry-free accounting. Manage your dairy business efficiently.",
    slide3_title: "Track Your Profits",
    slide3_desc:
      "Get clear summaries of your earnings, expenses, and overall financial health. Make informed decisions for your dairy.",
    dot_label: "Go to slide {{index}}", // For accessibility, {{index}} is a placeholder
  },
  common: {
    error: "Error",
    ok: "OK",
    try_again: "Please try again.",
    error_verifying_otp: "Error verifying OTP",
    error_sending_otp: "Error sending OTP",
    something_went_wrong: "Something went wrong. Please try again.", // New generic error
  },
  signup: {
    title: "Sign Up",
    name_placeholder: "Enter name",
    name_required: "Name is required",
    phone_placeholder: "Enter phone number",
    phone_required: "Phone number is required",
    phone_invalid: "Please enter a valid 10-digit phone number",
    referral_placeholder: "Enter referral code (Optional)",
    referral_optional_error_placeholder: "Referral code is optional", // For consistent spacing
    agree_to_the: "I agree to the",
    terms_and_conditions: "Terms and Conditions",
    terms_required: "You must agree to the terms and conditions",
    button_text: "Sign Up",
    success_otp_sent: "Sign up successful! OTP sent.",
    failed_to_send_otp_fallback: "Failed to send OTP.",
    failed_fallback: "Sign up failed.",
    already_have_account_prompt: "Already have an account?",
    signin_link: "Sign In",
  },
  signin: {
    title: "Sign In",
    phone_placeholder: "Enter phone number",
    phone_required: "Phone number is required",
    phone_invalid: "Please enter a valid 10-digit phone number",
    login_button: "Login",
    otp_success: "OTP sent successfully!",
    otp_failed_fallback: "Failed to send OTP. Please try again.",
    loading_text: "Loading session...", // Used in HeroScreen's loading state, but good to have here too
    no_account_prompt: "Don't have an account?",
    signup_link: "Sign Up",
  },
  otp: {
    enter_otp_title: "Enter OTP",
    otp_placeholder: "Enter 6-digit OTP",
    otp_required: "OTP is required",
    otp_length_invalid: "OTP must be 6 digits",
    verify_button: "Verify OTP",
    resend_button: "Resend OTP",
    resend_timer: "Resend OTP in {{minutes}}:{{seconds}}", // Interpolation for timer
    phone_not_found: "Phone number not found.",
    login_failed_no_token: "Login failed: No access token.",
    invalid_otp_fallback: "Invalid OTP",
    otp_sent_success: "OTP sent successfully!",
    failed_to_send_otp_fallback: "Failed to send OTP",
  },
  settings: {
    title: "General",
    language: "Language Settings",
  },
  account: {
    title: "Account",
    profile: "Profile",
    manage_subscription: "Manage Subscription",
    rate_list: "Rate List",
    summary: "Summary",
    support: "Support",
    help: "Help",
    about: "About",
    language: "Language",
    logout: "Logout",
  },
  home: {
    title: "Home",
    welcome_message: "Welcome to our app!",
    greeting: "Hello",
  },
  language_screen: {
    select_language: "Select Your Language",
    current_language: "Current Language",
    english: "English", // This is the key for the English name
    hindi: "Hindi", // This is the key for the Hindi name
    unknown_language: "Unknown",
    change_success: "Language changed successfully!",
    change_error: "Failed to change language. Please try again.",
  },
};

export default enTranslations;
