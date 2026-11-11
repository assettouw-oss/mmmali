"use client";
import { useEffect } from "react";
export default function VendreRedirect() {
  useEffect(() => { window.location.href = "/compte"; }, []);
  return <div className="p-10 text-center">Redirection vers Compte - Publications...</div>;
}