import axiosInstance from "@/lib/axiosIntance";

export interface SaveContact {
  name: string;
  phone: string;
}
export interface Signup {
  name: string;
  mobile: string;
  referral_code: string;
}
export interface Otp {
  mobile: string;
}
export interface Login {
  mobile: string;
  otp: string;
}

export const saveContactApi = async (data: SaveContact) => {
  try {
    await axiosInstance.post("/add_customer", data);
  } catch (error) {
    throw error;
  }
};

export const signUpApi = async (data: Signup) => {
  try {
    return await axiosInstance.post("/signup", data);
  } catch (error) {
    throw error;
  }
};

export const sendOtpApi = async (data: Otp) => {
  try {
    return await axiosInstance.post("/send_login_otp", data);
  } catch (error) {
    throw error;
  }
};

export const loginApi = async (data: Login) => {
  try {
    return await axiosInstance.post("/login", data);
  } catch (error) {
    throw error;
  }
};
