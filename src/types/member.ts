export type MemberRole = "customer" | "admin";
export type MemberProvider = "google" | "kakao" | null;
export type MemberStatus = "active" | "inactive" | "blocked" | "withdrawn";
export type MemberGrade = "normal" | "vip" | "black";

export type AdminMemberListItem = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: MemberRole;
  provider: MemberProvider;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;

  status: MemberStatus;
  grade: MemberGrade;
  memo: string | null;

  order_count: number;
  total_order_amount: number;
  address_count: number;
};

export type AdminMemberDetail = {
  profile: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    role: MemberRole;
    provider: MemberProvider;
    provider_user_id: string | null;
    created_at: string;
    updated_at: string;
    last_login_at: string | null;
  };
  admin_meta: {
    status: MemberStatus;
    grade: MemberGrade;
    memo: string | null;
    created_at: string;
    updated_at: string;
  };
  order_summary: {
    order_count: number;
    total_order_amount: number;
    last_order_at: string | null;
  };
  addresses: {
    id: number;
    recipient_name: string;
    recipient_phone: string;
    postal_code: string | null;
    address_main: string;
    address_detail: string | null;
    memo: string | null;
    is_default: boolean;
    created_at: string;
  }[];
  recent_orders: {
    id: number;
    order_number: string;
    status: string;
    total_amount: number;
    created_at: string;
  }[];
};

export type AdminMemberListParams = {
  search?: string;
  role?: "all" | MemberRole;
  provider?: "all" | Exclude<MemberProvider, null>;
  status?: "all" | MemberStatus;
  grade?: "all" | MemberGrade;
  sort?: "created_at_desc" | "created_at_asc" | "name_asc" | "email_asc";
};
