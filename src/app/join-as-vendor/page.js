import VendorJoinForm from "@/components/VendorJoinForm";

export const metadata = {
  title: "Join as Vendor",
  description: "Join MyShaadiStore as a vendor.",
};

export default function JoinAsVendorPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex justify-center">
        <VendorJoinForm />
      </div>
    </main>
  );
}
