"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Signup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle signup logic
    console.log("Sign up with:", name, email, password)
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#282828] text-white p-4">
      <Link 
        href="/" 
        className="flex items-center text-white hover:opacity-80 mb-8"
        data-component-name="LinkComponent"
        title="Back to Home"
      >
        <ArrowLeft className="h-6 w-6" />
        <span className="sr-only">Back</span>
      </Link>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Create an Account</h1>
            <p className="text-[#A0A0A0] mt-2">Join ScheduleSync today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-[#242424] border-[#333333] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#242424] border-[#333333] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#242424] border-[#333333] text-white"
              />
            </div>

            <Button type="submit" className="w-full bg-[#BB86FC] hover:bg-[#A66DF7] text-black">
              Create Account
            </Button>
          </form>

          <div className="text-center text-sm">
            <p className="text-[#A0A0A0]">
              Already have an account?{" "}
              <Link href="/login" className="text-[#BB86FC] hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
