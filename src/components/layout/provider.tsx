"use client"

import { LazyMotion, MotionConfig } from "framer-motion"

import { ToastViewport } from "@/components/ui/toast"

import { Space } from "../space"

const loadFeatures = () =>
  import("../ui/motion-features").then((module) => module.default)

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion='user'>
        <Space />
        {children}

        <ToastViewport />
      </MotionConfig>
    </LazyMotion>
  )
}
