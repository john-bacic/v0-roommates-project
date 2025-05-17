interface User {
  id: number
  name: string
  color: string
  initial: string
}

interface UserListProps {
  users: User[]
}

export function UserList({ users }: UserListProps) {
  return (
    <div className="bg-[#333333] rounded-lg p-4">
      <h3 className="text-sm font-medium mb-4">Roommates</h3>

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ backgroundColor: user.color, color: "#000" }}
            >
              {user.initial}
            </div>
            <span className="text-sm">{user.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
