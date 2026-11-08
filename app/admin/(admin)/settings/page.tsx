import { AddressCard, DeleteAccountCard, PrivacyCard, ProfileCard } from "@/app/dashboard/(dashboard)/settings/page";

export default function Page() {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <ProfileCard />
      <div className="space-y-5">
        <AddressCard />
        <PrivacyCard />
        <DeleteAccountCard />
      </div>
    </div>
  );
}
