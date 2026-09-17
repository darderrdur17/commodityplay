import { getMentorApplyPageCopy } from "@/lib/content/accessors";
import { MentorApplyForm } from "./mentor-apply-form";

export default async function MentorApplyPage() {
  const copy = await getMentorApplyPageCopy();
  return <MentorApplyForm copy={copy} />;
}
