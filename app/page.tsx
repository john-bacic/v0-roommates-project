"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { caveat } from "./fonts"

export default function Home() {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && password === "Tokyo") {
      // In a real app, we'd store this in localStorage or a cookie
      localStorage.setItem("userName", name)
      router.push("/dashboard")
    } else if (password !== "Tokyo") {
      // Show an error for incorrect password
      alert("Incorrect password. Please try again.")
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#282828] text-white p-4">
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
            {/* <Label htmlFor="name">Name</Label> */}
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
            {/* <Label htmlFor="password">Password</Label> */}
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


      </div>
    </main>
  )
}
