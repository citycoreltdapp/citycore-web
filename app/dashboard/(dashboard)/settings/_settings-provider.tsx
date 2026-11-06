"use client";
import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from "react";

import { EMPTY_PHONE_NUMBER } from "@/lib/phone-number";

import type { AddressValues, ProfileValues } from "./_schemas";

const DEFAULT_PROFILE: ProfileValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: EMPTY_PHONE_NUMBER,
  gender: "Prefer not to say",
  tagline: "",
  privacy: false,
  terms: false,
};
const DEFAULT_ADDRESS: AddressValues = { country: "", address1: "", address2: "", zip: "" };
export interface ProfilePhoto {
  url: string;
  name: string;
}
function useSettingsState() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [visibility, setVisibility] = useState("anyone");
  const [twoFactorSelection, setTwoFactorSelection] = useState({ authenticator: false, sms: false, email: false });
  const [photo, setPhoto] = useState<ProfilePhoto | null>(null);
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((url) => URL.revokeObjectURL(url)), []);
  const createPhoto = (file: File) => {
    const url = URL.createObjectURL(file);
    urls.current.push(url);
    return { url, name: file.name };
  };
  return {
    profile,
    setProfile,
    address,
    setAddress,
    visibility,
    setVisibility,
    photo,
    setPhoto,
    createPhoto,
    twoFactorSelection,
    setTwoFactorSelection,
  };
}
const SettingsContext = createContext<ReturnType<typeof useSettingsState> | null>(null);
export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSettingsState();
  return <SettingsContext value={settings}>{children}</SettingsContext>;
}
export function useSettings() {
  const settings = useContext(SettingsContext);
  if (!settings) throw new Error("SettingsProvider is required");
  return settings;
}
