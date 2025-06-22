import { redirect } from "next/navigation";

const page = () => {
  redirect("/auth/login");
};

export default page;
