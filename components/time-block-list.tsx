"use client"
import { Button } from "@/components/ui/button"
import { Trash2, Clock, ArrowRight } from "lucide-react"

interface TimeBlock {
  id?: string
  start: string
  end: string
  label: string
  allDay?: boolean
}

interface TimeBlockListProps {
  day: string
  timeBlocks: TimeBlock[]
  userName: string
  userColor: string
  onEditBlock: (day: string, block: TimeBlock) => void
  onDeleteBlock: (day: string, blockId: string) => void
}

export function TimeBlockList({
  day,
  timeBlocks,
  userName,
  userColor,
  onEditBlock,
  onDeleteBlock,
}: TimeBlockListProps) {
  // Sort time blocks by start time
  const sortedBlocks = [...timeBlocks].sort((a, b) => {
    const aTime = a.start.split(":").map(Number)
    const bTime = b.start.split(":").map(Number)
    return aTime[0] * 60 + aTime[1] - (bTime[0] * 60 + bTime[1])
  })

  // Format time for display (convert 24h to 12h format)
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  // Calculate gaps between time blocks
  const getGapBetweenBlocks = (currentBlock: TimeBlock, nextBlock: TimeBlock) => {
    if (!currentBlock || !nextBlock) return null

    const currentEndTime = currentBlock.end.split(":").map(Number)
    const nextStartTime = nextBlock.start.split(":").map(Number)

    const currentEndMinutes = currentEndTime[0] * 60 + currentEndTime[1]
    const nextStartMinutes = nextStartTime[0] * 60 + nextStartTime[1]

    const gapMinutes = nextStartMinutes - currentEndMinutes

    if (gapMinutes <= 0) return null

    const hours = Math.floor(gapMinutes / 60)
    const minutes = gapMinutes % 60

    if (hours === 0) {
      return `${minutes}m break`
    } else if (minutes === 0) {
      return `${hours}h break`
    } else {
      return `${hours}h ${minutes}m break`
    }
  }

  return (
    <div className="space-y-3 mt-4">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: userColor }}></div>
        {userName}'s Schedule for {day}
      </h3>

      {sortedBlocks.length === 0 ? (
        <p className="text-sm text-[#A0A0A0]">No scheduled activities for this day.</p>
      ) : (
        <div className="space-y-2">
          {sortedBlocks.map((block, index) => (
            <div key={block.id || index}>
              <div className="bg-[#242424] rounded-md p-3 flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">{block.label}</div>
                  <div className="text-xs text-[#A0A0A0] flex items-center mt-1">
                    {block.allDay ? (
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        All Day
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(block.start)} <ArrowRight className="h-3 w-3 mx-1" /> {formatTime(block.end)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-[#333333] text-white"
                    onClick={() => onEditBlock(day, block)}
                  >
                    <span className="sr-only">Edit</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-pencil"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[#CF6679] hover:bg-[#333333]"
                    onClick={() => block.id && onDeleteBlock(day, block.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>

              {/* Show gap between this block and the next one */}
              {index < sortedBlocks.length - 1 && !block.allDay && !sortedBlocks[index + 1].allDay && (
                <div className="my-2">
                  {getGapBetweenBlocks(block, sortedBlocks[index + 1]) && (
                    <div className="flex items-center justify-center text-xs text-[#A0A0A0] py-1">
                      <div className="h-px bg-[#333333] w-16 mr-2"></div>
                      {getGapBetweenBlocks(block, sortedBlocks[index + 1])}
                      <div className="h-px bg-[#333333] w-16 ml-2"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
