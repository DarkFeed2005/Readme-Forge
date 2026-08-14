"use client";

import dynamic from "next/dynamic";

const Background3DScene = dynamic(() => import("@/components/Background3DScene"), {
  ssr: false,
  loading: () => null,
});

export default function Background3D() {
  return <Background3DScene />;
}
