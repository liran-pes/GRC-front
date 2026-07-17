import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Icon } from "@/components/Icon"

function HighlightedSubtitle({ children }) {
  return String(children).split(/(GRC)/g).map((part, index) => (
    part === "GRC" ? <span className="grc" key={`${part}-${index}`}>{part}</span> : part
  ))
}

export function AppHeader({ appInfo, currentUser, query, unreadCount, onQueryChange, onNotifications, onUserAction }) {
  return (
    <header className="top-header">
      <div className="brand">
        <img src="/assets/logo.png" alt="לוגו עץ הזית" className="brand-logo" />
        <div className="brand-text">
          <div className="brand-title">{appInfo.brandTitle}</div>
          <div className="brand-sub">
            <HighlightedSubtitle>{appInfo.brandSubtitle}</HighlightedSubtitle>
          </div>
          <div className="brand-tags">
            {appInfo.brandTags.map((tag, index) => (
              <span className="contents" key={tag}>
                {index > 0 && <span className="dot">●</span>}
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="header-tools">
        <label className="search-box" aria-label="חיפוש במסך הנוכחי">
          <Icon name="search" size={19} />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={appInfo.searchPlaceholder}
            className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          />
        </label>

        <Button
          variant="outline"
          size="icon"
          className="icon-btn"
          title="התראות"
          aria-label={`התראות${unreadCount ? ` — ${unreadCount} חדשות` : ""}`}
          onClick={onNotifications}
        >
          <Icon name="bell" size={21} />
          {unreadCount > 0 && <span className="badge-dot" />}
        </Button>

        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="user-chip h-auto p-0 hover:bg-transparent">
              <span>{currentUser.name}</span>
              <span className="avatar">
                <Icon name="user" size={22} />
              </span>
              <Icon name="chev-down" className="chev" size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60 text-right" dir="rtl">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>{currentUser.name}</span>
              <Badge variant="secondary">{currentUser.role}</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onUserAction("profile")}>פרופיל אישי</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onUserAction("preferences")}>העדפות תצוגה</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onUserAction("permissions")}>הרשאות</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onUserAction("logout")}>יציאה</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
