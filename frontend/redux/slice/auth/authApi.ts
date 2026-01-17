import axiosInstance from "@/lib/axiosIntance";
import logger from "@/lib/logger";

export interface Signup {
  name: string;
  mobile: string;
  referral_code: string | undefined;
}
export interface Otp {
  mobile_number: string;
}
export interface Login {
  mobile: string;
  otp: string;
}

export const signUpApi = async (data: Signup) => {
  try {
    logger.info("User signup attempt", { mobile: data.mobile });
    const response = await axiosInstance.post("/auth/signup", data);
    logger.info("User signup successful", { mobile: data.mobile });
    return response;
  } catch (error) {
    logger.error("User signup failed", error as Error, { mobile: data.mobile });
    throw error;
  }
};

export const sendOtpApi = async (data: Otp) => {
  try {
    logger.info("OTP send request", { mobile: data.mobile_number });
    const response = await axiosInstance.post("/auth/send_login_otp", data);
    logger.info("OTP sent successfully", { mobile: data.mobile_number });
    return response;
  } catch (error) {
    logger.error("OTP send failed", error as Error, {
      mobile: data.mobile_number,
    });
    throw error;
  }
};

export const loginApi = async (data: Login) => {
  try {
    logger.info("User login attempt", { mobile: data.mobile });
    const response = await axiosInstance.post("/auth/login", data);
    logger.info("User login successful", { mobile: data.mobile });
    return response;
  } catch (error) {
    logger.error("User login failed", error as Error, { mobile: data.mobile });
    throw error;
  }
};
