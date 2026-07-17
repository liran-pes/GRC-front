import { Button } from "@/components/ui/button"
import { Icon } from "@/components/Icon"

export function MainNavigation({ items, activeScreen, onNavigate }) {
  return (
    <nav className="main-nav" aria-label="ניווט ראשי">
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Button
              type="button"
              variant="ghost"
              className={`nav-item h-auto rounded-none shadow-none ${activeScreen === item.id ? "active" : ""}`}
              aria-current={activeScreen === item.id ? "page" : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <Icon name={item.icon} />
              {item.label}
              {item.expandable && <Icon name="chev-down" className="chev" />}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
