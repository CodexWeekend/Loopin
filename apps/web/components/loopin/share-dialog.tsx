"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  Link2,
  Copy,
  Check,
  Mail,
  Globe,
  Lock,
  Users,
  UserPlus,
  Eye,
  Edit3,
  Trash2,
  X,
  Download,
  Printer,
  FileText,
} from "lucide-react"
import type { Trip, Collaborator, User } from "@/lib/types"
import { sampleUsers } from "@/lib/sample-data"

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  trip: Trip
  onInvite?: (email: string, role: "editor" | "viewer") => void
  onRemoveCollaborator?: (userId: string) => void
  onUpdateVisibility?: (isPublic: boolean) => void
}

export function ShareDialog({
  open,
  onClose,
  trip,
  onInvite,
  onRemoveCollaborator,
  onUpdateVisibility,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer")
  const [isPublic, setIsPublic] = useState(trip.isPublic)

  const shareUrl = `https://loopin.app/trip/${trip.id}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInvite = () => {
    if (email) {
      onInvite?.(email, inviteRole)
      setEmail("")
    }
  }

  const handleVisibilityChange = (checked: boolean) => {
    setIsPublic(checked)
    onUpdateVisibility?.(checked)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share trip</DialogTitle>
          <DialogDescription>
            Invite collaborators or share a read-only link
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="share" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="share" className="flex-1">
              Share Link
            </TabsTrigger>
            <TabsTrigger value="collaborate" className="flex-1">
              Collaborate
            </TabsTrigger>
            <TabsTrigger value="export" className="flex-1">
              Export
            </TabsTrigger>
          </TabsList>

          {/* Share Link Tab */}
          <TabsContent value="share" className="space-y-4 pt-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="h-5 w-5 text-primary" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {isPublic ? "Public link" : "Private"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isPublic
                      ? "Anyone with the link can view"
                      : "Only invited collaborators can access"}
                  </p>
                </div>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={handleVisibilityChange}
              />
            </div>

            {isPublic && (
              <div className="space-y-2">
                <Label>Share link</Label>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="bg-muted" />
                  <Button onClick={handleCopy} className="gap-2 whitespace-nowrap">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Collaborate Tab */}
          <TabsContent value="collaborate" className="space-y-4 pt-4">
            {/* Invite form */}
            <div className="space-y-3">
              <Label>Invite by email</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <div className="flex gap-1 rounded-md border">
                  <button
                    className={cn(
                      "rounded-l-md px-3 py-2 text-sm transition-colors",
                      inviteRole === "viewer"
                        ? "bg-muted font-medium"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setInviteRole("viewer")}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className={cn(
                      "rounded-r-md px-3 py-2 text-sm transition-colors",
                      inviteRole === "editor"
                        ? "bg-muted font-medium"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setInviteRole("editor")}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
                <Button onClick={handleInvite} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Viewers can see the trip. Editors can propose changes and add comments.
              </p>
            </div>

            {/* Current collaborators */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Collaborators</Label>
                <span className="text-sm text-muted-foreground">
                  {trip.collaborators.length + 1} people
                </span>
              </div>
              <div className="space-y-2">
                {/* Owner */}
                <CollaboratorRow
                  user={sampleUsers[0]}
                  role="owner"
                  isOwner
                />
                {/* Other collaborators */}
                {trip.collaborators
                  .filter((c) => c.role !== "owner")
                  .map((collab) => (
                    <CollaboratorRow
                      key={collab.userId}
                      user={collab.user}
                      role={collab.role}
                      onRemove={() => onRemoveCollaborator?.(collab.userId)}
                    />
                  ))}
                {/* Placeholder if no collaborators */}
                {trip.collaborators.length === 1 && (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No collaborators yet. Invite someone to plan together!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Export your trip for offline access or printing
            </p>
            <div className="grid gap-3">
              <Button variant="outline" className="justify-start gap-3">
                <Download className="h-4 w-4" />
                Download offline trip card
                <Badge variant="secondary" className="ml-auto">
                  PDF
                </Badge>
              </Button>
              <Button variant="outline" className="justify-start gap-3">
                <Printer className="h-4 w-4" />
                Print itinerary
              </Button>
              <Button variant="outline" className="justify-start gap-3">
                <FileText className="h-4 w-4" />
                Export to calendar
                <Badge variant="secondary" className="ml-auto">
                  .ics
                </Badge>
              </Button>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium">Offline trip card</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                A condensed version of your trip with addresses, times, and essential
                info. Works without internet and includes emergency contacts.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ============ Sub-components ============

interface CollaboratorRowProps {
  user: User
  role: "owner" | "editor" | "viewer"
  isOwner?: boolean
  onRemove?: () => void
}

function CollaboratorRow({ user, role, isOwner, onRemove }: CollaboratorRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">
            {user.name}
            {isOwner && (
              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={role === "owner" ? "default" : "secondary"} className="capitalize">
          {role}
        </Badge>
        {!isOwner && onRemove && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
