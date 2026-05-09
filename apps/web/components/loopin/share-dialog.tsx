"use client"

import { useEffect, useState } from "react"
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
  Copy,
  Check,
  Globe,
  Lock,
  Users,
  UserPlus,
  Eye,
  Edit3,
  X,
  Download,
  Printer,
  FileText,
} from "lucide-react"
import type { Collaborator, Trip, User } from "@/lib/types"

type InviteRole = "editor" | "viewer"

interface ShareDialogProps {
  open: boolean
  onClose: () => void
  trip: Trip
  collaborators?: Collaborator[]
  currentUserId?: string
  inviteEmail?: string
  inviteRole?: InviteRole
  isPublic?: boolean
  owner?: User | null
  shareUrl?: string
  onExportCalendar?: () => void
  onExportOfflineTripCard?: () => void
  onInvite?: (email: string, role: InviteRole) => void
  onInviteEmailChange?: (email: string) => void
  onInviteRoleChange?: (role: InviteRole) => void
  onPrintItinerary?: () => void
  onRemoveCollaborator?: (userId: string) => void
  onUpdateVisibility?: (isPublic: boolean) => void
}

export function ShareDialog({
  open,
  onClose,
  trip,
  collaborators,
  currentUserId,
  inviteEmail,
  inviteRole,
  isPublic,
  owner,
  shareUrl,
  onExportCalendar,
  onExportOfflineTripCard,
  onInvite,
  onInviteEmailChange,
  onInviteRoleChange,
  onPrintItinerary,
  onRemoveCollaborator,
  onUpdateVisibility,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [localInviteEmail, setLocalInviteEmail] = useState("")
  const [localInviteRole, setLocalInviteRole] = useState<InviteRole>("viewer")
  const [localIsPublic, setLocalIsPublic] = useState(isPublic ?? trip.isPublic)

  const collaboratorList = collaborators ?? trip.collaborators
  const ownerUser = owner ?? collaboratorList.find((collaborator) => collaborator.role === "owner")?.user ?? null
  const regularCollaborators = ownerUser
    ? collaboratorList.filter((collaborator) => collaborator.user.id !== ownerUser.id)
    : collaboratorList
  const resolvedCurrentUserId = currentUserId ?? ownerUser?.id
  const resolvedInviteEmail = inviteEmail ?? localInviteEmail
  const resolvedInviteRole = inviteRole ?? localInviteRole
  const resolvedIsPublic = isPublic ?? localIsPublic
  const resolvedShareUrl = shareUrl ?? `/trips/${trip.id}`
  const collaboratorCount = regularCollaborators.length + (ownerUser ? 1 : 0)

  useEffect(() => {
    setLocalIsPublic(isPublic ?? trip.isPublic)
  }, [isPublic, trip.isPublic])

  useEffect(() => {
    if (!open) {
      setCopied(false)
    }
  }, [open])

  function setInviteEmailValue(value: string) {
    onInviteEmailChange?.(value)

    if (inviteEmail === undefined) {
      setLocalInviteEmail(value)
    }
  }

  function setInviteRoleValue(value: InviteRole) {
    onInviteRoleChange?.(value)

    if (inviteRole === undefined) {
      setLocalInviteRole(value)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(resolvedShareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleInvite() {
    const normalizedEmail = resolvedInviteEmail.trim()
    if (!normalizedEmail) {
      return
    }

    onInvite?.(normalizedEmail, resolvedInviteRole)
    setInviteEmailValue("")
  }

  function handleVisibilityChange(checked: boolean) {
    if (isPublic === undefined) {
      setLocalIsPublic(checked)
    }

    onUpdateVisibility?.(checked)
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
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

          <TabsContent value="share" className="space-y-4 pt-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                {resolvedIsPublic ? (
                  <Globe className="h-5 w-5 text-primary" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {resolvedIsPublic ? "Public link" : "Private"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {resolvedIsPublic
                      ? "Anyone with the link can view"
                      : "Only invited collaborators can access"}
                  </p>
                </div>
              </div>
              <Switch
                checked={resolvedIsPublic}
                onCheckedChange={handleVisibilityChange}
              />
            </div>

            {resolvedIsPublic ? (
              <div className="space-y-2">
                <Label>Share link</Label>
                <div className="flex gap-2">
                  <Input value={resolvedShareUrl} readOnly className="bg-muted" />
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
            ) : null}
          </TabsContent>

          <TabsContent value="collaborate" className="space-y-4 pt-4">
            <div className="space-y-3">
              <Label>Invite by email</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={resolvedInviteEmail}
                  onChange={(event) => setInviteEmailValue(event.target.value)}
                  className="flex-1"
                />
                <div className="flex gap-1 rounded-md border">
                  <button
                    type="button"
                    className={cn(
                      "rounded-l-md px-3 py-2 text-sm transition-colors",
                      resolvedInviteRole === "viewer"
                        ? "bg-muted font-medium"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setInviteRoleValue("viewer")}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-r-md px-3 py-2 text-sm transition-colors",
                      resolvedInviteRole === "editor"
                        ? "bg-muted font-medium"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setInviteRoleValue("editor")}
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Collaborators</Label>
                <span className="text-sm text-muted-foreground">
                  {collaboratorCount} people
                </span>
              </div>
              <div className="space-y-2">
                {ownerUser ? (
                  <CollaboratorRow
                    user={ownerUser}
                    role="owner"
                    isOwner={ownerUser.id === resolvedCurrentUserId}
                  />
                ) : null}
                {regularCollaborators.map((collaborator) => (
                  <CollaboratorRow
                    key={collaborator.userId}
                    user={collaborator.user}
                    role={collaborator.role}
                    onRemove={() => onRemoveCollaborator?.(collaborator.userId)}
                  />
                ))}
                {regularCollaborators.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No collaborators yet. Invite someone to plan together!
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Export your trip for offline access or printing
            </p>
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="justify-start gap-3"
                onClick={onExportOfflineTripCard}
              >
                <Download className="h-4 w-4" />
                Download offline trip card
                <Badge variant="secondary" className="ml-auto">
                  PDF
                </Badge>
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-3"
                onClick={onPrintItinerary}
              >
                <Printer className="h-4 w-4" />
                Print itinerary
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-3"
                onClick={onExportCalendar}
              >
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

interface CollaboratorRowProps {
  user: User
  role: Collaborator["role"]
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
            {isOwner ? (
              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={role === "owner" ? "default" : "secondary"} className="capitalize">
          {role}
        </Badge>
        {!isOwner && onRemove ? (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove}>
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
