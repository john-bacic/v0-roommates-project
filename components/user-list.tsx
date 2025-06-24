import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface User {
  id: number
  name: string
  color: string
  initial: string
}

interface UserListProps {
  users: User[]
  currentUserId?: number
}

export function UserList({ users, currentUserId }: UserListProps) {
  return (
    <div className="bg-[#333333] rounded-lg p-4">
      <h3 className="text-sm font-medium mb-4">Roommates</h3>

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ backgroundColor: user.color, color: "#000" }}
              >
                {user.initial}
              </div>
              <span className="text-sm">{user.name}</span>
            </div>
            
            {/* Message icon - only show for other users */}
            {currentUserId && user.id !== currentUserId && (
              <Link href={`/messages?toUserId=${user.id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={`Message ${user.name}`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
