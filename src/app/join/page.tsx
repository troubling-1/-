import type { Metadata } from "next";
import { JoinForm } from "./join-form";

export const metadata: Metadata = {
  title: "申请成为护航师",
  description: "提交三角洲行动护航师入驻资料，等待平台管理员审核，通过后可进入护航师后台接单。",
  alternates: {
    canonical: "/join",
  },
};

export default function JoinPage() {
  return <JoinForm />;
}
