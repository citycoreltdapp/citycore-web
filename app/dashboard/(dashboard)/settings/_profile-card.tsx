"use client";
import { useState } from "react";

import { AppModal } from "@/components/primitives/app-modal";
import { FileUpload } from "@/components/primitives/file-upload";
import { PhoneNumberField } from "@/components/primitives/phone-number-field";
import { TextField } from "@/components/primitives/text-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { type ProfileValues, profileSchema } from "./_schemas";
import { useSettings } from "./_settings-provider";
import { FormActions, SettingsPanel } from "./_shared";
import { TaglineField } from "./_tagline-field";

export function ProfileCard() {
  const settings = useSettings();
  const [photo, setPhoto] = useState(settings.photo);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: settings.profile,
    mode: "onTouched",
  });
  const upload = () =>
    AppModal.open({
      title: "Upload profile photo",
      description: "Preview a JPG, PNG or WebP up to 5 MB. The image stays in this browser session.",
      content: (
        <FileUpload
          id="profile-photo-upload"
          browseLabel="Choose image"
          dropzoneAccept={{ "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] }}
          dropzoneMaxSize={5 * 1024 * 1024}
          dropzoneMaxFiles={1}
          onFilesAdded={(files) => {
            if (files[0]) {
              setPhoto(settings.createPhoto(files[0]));
              AppModal.close();
            }
          }}
          onFilesRejected={() => toast.error("Choose one JPG, PNG or WebP image smaller than 5 MB.")}
        />
      ),
    });
  const cancel = () => {
    form.reset(settings.profile);
    setPhoto(settings.photo);
  };
  return (
    <SettingsPanel title="Account Settings">
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit((values) => {
          settings.setProfile(values);
          settings.setPhoto(photo);
          form.reset(values);
          toast.success("Profile saved for this settings session.");
        })}
      >
        <div className="flex flex-wrap items-center gap-4 border-b border-border pb-5">
          <Avatar className="size-16">
            <AvatarImage
              src={photo?.url ?? "/assets/images/settings/profile-placeholder.png"}
              alt="Profile photo preview"
            />
            <AvatarFallback>Photo</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 basis-40">
            <p className="text-sm font-semibold">Profile photo</p>
            <p className="truncate text-xs text-muted-foreground">
              {photo ? `${photo.name} • preview only until saved` : "JPG, PNG or WebP up to 5 MB"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-9 rounded-full px-4" onClick={upload}>
              Upload image
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-full px-3"
              disabled={!photo}
              onClick={() => setPhoto(null)}
            >
              Remove
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              { name: "firstName", label: "First Name", autoComplete: "given-name" },
              { name: "lastName", label: "Last Name", autoComplete: "family-name" },
            ] as const
          ).map((item) => (
            <Controller
              key={item.name}
              control={form.control}
              name={item.name}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  id={`profile-${item.name}`}
                  label={item.label}
                  autoComplete={item.autoComplete}
                  error={fieldState.error?.message}
                />
              )}
            />
          ))}
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                id="profile-email"
                type="email"
                label="Email"
                autoComplete="email"
                placeholder="you@example.com"
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <PhoneNumberField
                {...field}
                id="profile-phone"
                label="Phone (optional)"
                inputPlaceholder="0802 345 6789"
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
        <Controller
          control={form.control}
          name="gender"
          render={({ field, fieldState }) => (
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">Gender</legend>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                aria-label="Gender"
                className="flex flex-wrap gap-2"
              >
                {["Male", "Female", "Prefer not to say"].map((value) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm transition-colors hover:bg-muted/50 has-data-checked:border-foreground/25 has-data-checked:bg-muted/60"
                  >
                    <RadioGroupItem value={value} />
                    {value}
                  </label>
                ))}
              </RadioGroup>
              {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
            </fieldset>
          )}
        />
        <Controller
          control={form.control}
          name="tagline"
          render={({ field, fieldState }) => <TaglineField {...field} error={fieldState.error?.message} />}
        />
        {(
          [
            { name: "privacy", label: "I acknowledge the privacy policy", href: "/privacy" },
            { name: "terms", label: "I acknowledge the terms & conditions", href: "/terms" },
          ] as const
        ).map((item) => (
          <Controller
            key={item.name}
            control={form.control}
            name={item.name}
            render={({ field, fieldState }) => (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-border p-3.5 transition-colors has-aria-invalid:border-destructive/50 has-data-checked:border-foreground/25 has-data-checked:bg-muted/60">
                  <label className="flex cursor-pointer items-start gap-3 text-sm/5">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      aria-invalid={!!fieldState.error}
                      className="mt-0.5"
                    />
                    {item.label}
                  </label>
                  <Button
                    type="button"
                    variant="link"
                    className="ml-7 h-auto p-0 text-xs sm:ml-0"
                    onClick={() =>
                      AppModal.open({
                        title: item.name === "privacy" ? "Privacy policy" : "Terms & conditions",
                        description: "Document not available in this preview",
                        content: (
                          <p className="text-sm leading-relaxed">
                            The current document has not been connected yet. These checkboxes demonstrate the profile
                            form; they do not record legal acceptance.
                          </p>
                        ),
                        primaryButton: { children: "Close" },
                      })
                    }
                  >
                    Read {item.name === "privacy" ? "privacy policy" : "terms"}
                  </Button>
                </div>
                {fieldState.error && <p className="mt-1.5 text-xs text-destructive">{fieldState.error.message}</p>}
              </div>
            )}
          />
        ))}
        <FormActions onCancel={cancel} />
      </form>
    </SettingsPanel>
  );
}
