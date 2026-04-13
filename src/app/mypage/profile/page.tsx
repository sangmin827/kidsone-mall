// src/app/mypage/profile/page.tsx
import ProfileForm from "@/src/components/mypage/ProfileForm";
import { getMyProfile } from "@/src/server/mypage";

export default async function MyProfilePage() {
  const profile = await getMyProfile();

  if (!profile) {
    return <div className="p-6">프로필 정보를 불러올 수 없습니다.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">내 정보</h1>
      <ProfileForm profile={profile} />
    </div>
  );
}
