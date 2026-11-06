"use client";

import { FileUpload } from "@/components/primitives/file-upload";
import type { OnboardingFormData } from "@/constant/onboarding";
import { phoneNumberToString } from "@/lib/phone-number";
import { useFormContext } from "react-hook-form";

const DOCUMENT_FIELDS = ["idCard", "passportPhotograph"] as const;

const formatDate = (isoDate: string) => isoDate.split("-").reverse().join("/");

export function ReviewStep({ onEditDocuments }: { onEditDocuments: () => void }) {
  const { getValues, setValue } = useFormContext<OnboardingFormData>();
  const values = getValues();

  const details = [
    ["Surname", values.surname],
    ["First Name", values.firstName],
    ["Other Name", values.otherName],
    ["Phone Number", phoneNumberToString(values.phoneNumber)],
    ["Date Of Birth", formatDate(values.dateOfBirth)],
    ["Gender", values.gender],
    ["State Of Origin", values.stateOfOrigin],
    ["Local Government Of Origin", values.lgaOfOrigin],
    ["Residential Address", values.residentialAddress],
    ["State Of Residence", values.stateOfResidence],
    ["Local Government Of Residence", values.lgaOfResidence],
    ["City", values.cityOfResidence],
    ["NIN", values.nin],
    ["BVN", values.bvn],
  ].filter(([, value]) => value);

  return (
    <>
      <dl className="flex flex-col gap-4 text-base">
        {details.map(([label, value]) => (
          <div key={label} className="flex flex-wrap gap-x-1.5">
            <dt className="text-muted-foreground">{label}:</dt>
            <dd className="font-medium break-all">{value}</dd>
          </div>
        ))}
      </dl>

      <FileUpload
        id="documents"
        className="mt-2"
        items={DOCUMENT_FIELDS.flatMap((field) => {
          const file = values[field];
          return file ? [{ id: field, name: file.name, size: file.size, status: "completed" as const }] : [];
        })}
        onRemove={(id) => {
          setValue(id as (typeof DOCUMENT_FIELDS)[number], null);
          onEditDocuments();
        }}
      />
    </>
  );
}
