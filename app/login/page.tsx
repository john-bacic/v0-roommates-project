"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { caveat } from "../fonts"
import GitCommitHash from "@/components/git-commit-hash"
import { useRouter } from "next/navigation"

export default function Login() {
  const [isClient, setIsClient] = useState(false)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && password === "Tokyo") {
      if (typeof window !== 'undefined') {
        localStorage.setItem("userName", name)
      }
      router.push("/dashboard")
    } else if (password !== "Tokyo") {
      alert("Incorrect password. Please try again.")
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-white p-4 relative overflow-hidden" style={{ backgroundColor: 'var(--color-bg-dark, #1e1e1e)' }}>
      {/* Background SVG texture */}
      <img 
        src="/BGlines.svg" 
        alt="background texture" 
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-60 z-0"
        style={{position: 'fixed'}}
        aria-hidden="true"
      />
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/icons/icon-336x336.png?v=1"
              alt="Roomeez Home Icon" 
              width="80" 
              height="80" 
              className="w-20 h-20"
              data-component-name="Home"
            />
          </div>
          <h1 
            className="text-6xl caveat-bold" 
            style={{ fontFamily: 'var(--font-caveat), cursive' }}
            data-component-name="Home"
          >
            Roomeez
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              required
              className="bg-[#242424] border-[#333333] text-white"
            />
          </div>

          <div className="space-y-2">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="bg-[#242424] border-[#333333] text-white"
            />
          </div>

          <Button type="submit" className="w-full bg-[#BB86FC] hover:bg-[#A66DF7] text-black">
            Enter App
          </Button>
        </form>

        <footer className="text-center text-sm text-gray-400 mt-8 pb-4" data-component-name="Footer">
          {isClient ? <GitCommitHash /> : <span className="text-[10px] text-[#666666] whitespace-nowrap">build: dev</span>}
        </footer>
      </div>
    </main>
  )
}
