import { CaptureForm } from "./capture-form";

export default function AddPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="font-hand text-3xl">New postcard</h1>
      <CaptureForm />
    </div>
  );
}
