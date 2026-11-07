"use client";
import { toast } from "sonner";

export function printPreview(title: string, lines: string[]) {
  const popup = window.open("", "_blank", "width=1000,height=800");
  if (!popup) {
    toast.error("Allow pop-ups to print or save this preview as PDF");
    return;
  }
  popup.opener = null;
  const doc = popup.document;
  doc.title = title;
  const style = doc.createElement("style");
  style.textContent =
    "body{font:14px system-ui;line-height:1.7;color:#222;padding:40px}h1{font-size:24px}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}small{color:#667085}";
  doc.head.append(style);
  const h1 = doc.createElement("h1");
  h1.textContent = title;
  doc.body.append(h1);
  const pre = doc.createElement("pre");
  pre.textContent = lines.join("\n\n");
  doc.body.append(pre);
  const note = doc.createElement("small");
  note.textContent = "City Core · illustrative preview · not a certified or published document";
  doc.body.append(note);
  popup.focus();
  popup.print();
}
