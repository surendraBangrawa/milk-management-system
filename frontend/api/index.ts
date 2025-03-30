import axiosInstance from "@/lib/axiosIntance";

export interface SaveContact {
  name: string;
  mobile: string;
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
export interface AddSellerTransaction {
  seller_mobile: string;
  amount: number;
  expense_detail: string;
  transaction_type: "GAVE" | "GOT";
  custom_date: string;
}

export const saveContactApi = async (data: SaveContact) => {
  try {
    return await axiosInstance.post("/add_customer", data);
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

export const getSellerSummaryApi = async () => {
  try {
    return await axiosInstance.get("/get_seller_summary");
  } catch (error) {
    throw error;
  }
};

export const getSellerTransactionApi = async (data: string) => {
  try {
    return await axiosInstance.get(`/get_transactions?seller_mobile=${data}`);
  } catch (error) {
    throw error;
  }
};

export const addSellerTransactionApi = async (data: AddSellerTransaction) => {
  try {
    return await axiosInstance.post(`/add_expense`, data);
  } catch (error) {
    throw error;
  }
};
