import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { AppHeader } from "@/components/AppHeader"
import { MainNavigation } from "@/components/MainNavigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import iconSprite from "@/legacy/icon-sprite.html?raw"
import { API_BASE_URL, loadApplicationData } from "@/services/api"

function screenFromHash(validScreens = new Set()) {
  const requested = window.location.hash.replace(/^#/, "")
  if (!requested) return "home"
  return validScreens.size === 0 || validScreens.has(requested) ? requested : "home"
}

function cleanText(element) {
  return (element?.textContent || "").replace(/\s+/g, " ").trim()
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;",
  })[character])
}

function DetailsDialog({ dialog }) {
  return (
    <>
      <div className="mock-modal-head">
        <span className="mock-chip">{dialog.chip}</span>
        <DialogTitle>{dialog.title}</DialogTitle>
      </div>

      <div className="mock-modal-body">
        {dialog.meta?.length > 0 && (
          <div className="mock-summary-grid">
            {dialog.meta.map((item) => (
              <div key={`${item.label}-${item.value}`}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        )}

        {dialog.sectionTitle && <h3>{dialog.sectionTitle}</h3>}

        <DialogDescription className="mock-dialog-description">
          {dialog.description}
        </DialogDescription>

        {dialog.items?.length > 0 && (
          <ul className="mock-alert-list">
            {dialog.items.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

function EntityForm({ config, chip, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="mock-modal-head">
        <span className="mock-chip">{chip}</span>
        <DialogTitle>{config.title}</DialogTitle>
      </div>
      <div className="mock-modal-body">
        <DialogDescription className="mock-dialog-description">{config.description}</DialogDescription>
        <div className="mock-form mock-dialog-form">
          {config.fields.map((field) => (
            <label key={field.name}>
              {field.label}
              <Input name={field.name} type={field.type} placeholder={field.placeholder} required dir="rtl" />
            </label>
          ))}
        </div>
      </div>
      <div className="mock-modal-actions">
        <Button type="submit" className="mock-action primary">שמירה</Button>
        <Button type="button" variant="outline" className="mock-action" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  )
}

export default function App() {
  const contentRef = useRef(null)
  const [applicationData, setApplicationData] = useState(null)
  const [loadError, setLoadError] = useState("")
  const [activeScreen, setActiveScreen] = useState("home")
  const [query, setQuery] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const [dialog, setDialog] = useState(null)

  const navigationItems = useMemo(() => applicationData?.navigation || [], [applicationData])
  const screensMarkup = applicationData?.screensHtml || ""
  const dialogs = applicationData?.dialogs || {}
  const forms = applicationData?.forms || {}
  const validScreens = useMemo(() => new Set(navigationItems.map((item) => item.id)), [navigationItems])
  const screenLabels = useMemo(
    () => Object.fromEntries(navigationItems.map((item) => [item.id, item.label])),
    [navigationItems],
  )
  const dialogChip = dialogs.row?.chip

  useEffect(() => {
    const controller = new AbortController()
    loadApplicationData(controller.signal)
      .then((data) => {
        setApplicationData(data)
        setUnreadCount(data.notifications.unreadCount)
        const availableScreens = new Set(data.navigation.map((item) => item.id))
        setActiveScreen(screenFromHash(availableScreens))
      })
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(error.message)
      })
    return () => controller.abort()
  }, [])

  const navigate = useCallback((screen) => {
    const target = validScreens.has(screen) ? screen : "home"
    if (window.location.hash !== `#${target}`) window.history.pushState(null, "", `#${target}`)
    setActiveScreen(target)
    setQuery("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [validScreens])

  useEffect(() => {
    const onHashChange = () => {
      setActiveScreen(screenFromHash(validScreens))
      setQuery("")
    }
    window.addEventListener("hashchange", onHashChange)
    if (!window.location.hash) window.history.replaceState(null, "", "#home")
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [validScreens])

  useEffect(() => {
    const root = contentRef.current
    if (!root) return

    root.querySelectorAll(".screen").forEach((section) => {
      section.classList.toggle("active", section.id === `screen-${activeScreen}`)
    })
  }, [activeScreen, screensMarkup])

  useEffect(() => {
    const root = contentRef.current
    if (!root) return
    const clickableSelector = [
      ".kpi-card",
      ".feature-card",
      ".task-item",
      ".gap-item",
      ".message-item",
      ".messages-teaser",
      ".requirement-card",
      "table.data tbody tr",
      ".link-blue",
      ".bar-col",
      ".chart-legend span",
      ".line-chart-svg",
    ].join(",")

    root.querySelectorAll(clickableSelector).forEach((element) => {
      element.classList.add("mock-clickable")
      if (!element.hasAttribute("tabindex")) element.setAttribute("tabindex", "0")
    })
  }, [screensMarkup])

  useEffect(() => {
    const root = contentRef.current
    if (!root) return
    const active = root.querySelector(`#screen-${activeScreen}`)
    root.querySelectorAll(".mock-hidden-by-search, .mock-highlight").forEach((element) => {
      element.classList.remove("mock-hidden-by-search", "mock-highlight")
    })
    if (!active || !query.trim()) return

    const normalizedQuery = query.trim().toLocaleLowerCase("he")
    active
      .querySelectorAll("table.data tbody tr, .task-item, .gap-item, .feature-card, .kpi-card, .requirement-card, .message-item")
      .forEach((element) => {
        const matches = cleanText(element).toLocaleLowerCase("he").includes(normalizedQuery)
        element.classList.toggle("mock-hidden-by-search", !matches)
        element.classList.toggle("mock-highlight", matches)
      })
  }, [activeScreen, query])

  function openDetails(element, titleOverride) {
    const rowTemplate = dialogs.row
    const taskTemplate = dialogs.task
    const kpiTemplate = dialogs.kpi
    const genericTemplate = dialogs.generic
    const title = titleOverride
      || element?.dataset?.requirementTitle
      || element?.dataset?.messageTitle
      || cleanText(element?.querySelector("h3, .cell-title, .kpi-label, strong"))
      || screenLabels[activeScreen]
    const rawDescription = cleanText(element)

    if (element?.matches("tr")) {
      const fields = Array.from(element.querySelectorAll("td")).map((cell, index) => ({
        label: rowTemplate.fieldLabelTemplate.replace("{index}", index + 1),
        value: cleanText(cell) || rowTemplate.emptyFieldValue,
      }))

      setDialog({
        type: "details",
        chip: rowTemplate.chip,
        title,
        meta: fields,
        sectionTitle: rowTemplate.sectionTitle,
        description: rowTemplate.description,
        items: rowTemplate.timeline,
        actions: rowTemplate.actions,
      })
      return
    }

    if (element?.matches(".task-item, .gap-item")) {
      setDialog({
        type: "details",
        chip: dialogChip,
        title,
        meta: taskTemplate.meta,
        description: rawDescription.slice(0, 420) || taskTemplate.fallbackDescription,
        items: taskTemplate.timeline,
        actions: taskTemplate.actions,
      })
      return
    }

    if (element?.matches(".kpi-card")) {
      const label = cleanText(element.querySelector(".kpi-label")) || title
      const value = cleanText(element.querySelector(".kpi-value")) || "—"
      setDialog({
        type: "details",
        chip: dialogChip,
        title: label,
        meta: [{ label: kpiTemplate.valueLabel, value }],
        sectionTitle: kpiTemplate.sectionTitle,
        description: kpiTemplate.description,
        items: kpiTemplate.timeline,
        actions: kpiTemplate.actions,
      })
      return
    }

    setDialog({
      type: "details",
      chip: dialogChip,
      title,
      description: rawDescription.slice(0, 420) || genericTemplate.fallbackDescription,
      meta: [
        { label: genericTemplate.metaLabels.domain, value: screenLabels[activeScreen] },
        { label: genericTemplate.metaLabels.status, value: cleanText(element?.querySelector(".status")) || genericTemplate.metaLabels.active },
        { label: genericTemplate.metaLabels.updated, value: new Intl.DateTimeFormat("he-IL").format(new Date()) },
      ],
      items: genericTemplate.timeline,
      actions: genericTemplate.actions,
    })
  }

  function downloadReport(title) {
    const content = [
      "עץ הזית — מערכת GRC ארגונית",
      `דוח: ${title}`,
      `תאריך הפקה: ${new Date().toLocaleString("he-IL")}`,
      "",
      `מסך מקור: ${screenLabels[activeScreen]}`,
      "הקובץ הופק מאפליקציית GRC המבוססת React.",
    ].join("\n")
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${title.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "_")}.txt`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("הדוח הופק והורד בהצלחה")
  }

  function filterStandards(state) {
    const rows = contentRef.current?.querySelectorAll("#standards-table tbody tr") || []
    rows.forEach((row) => row.classList.toggle("mock-hidden-by-standard-filter", row.dataset.standardState !== state))
    toast.success(`המאגר סונן לפי סטטוס: ${state}`)
  }

  function handleStandardAction(action, element) {
    if (action === "add") return setDialog({ type: "form", formType: "standard" })
    if (action === "export") return downloadReport("מאגר תקנים")
    if (action === "open-requirements") return navigate("requirements")
    if (action.startsWith("filter-")) return filterStandards(action.replace("filter-", ""))

    const row = element.closest("tr")
    const status = row?.querySelector(".standard-status")
    if (action === "publish" && row && status) {
      row.dataset.standardState = "published"
      status.className = "status st-green standard-status"
      status.innerHTML = '<span class="dot"></span>פורסם'
      return toast.success("התקן פורסם בהצלחה")
    }
    if (action === "retire" && row && status) {
      row.dataset.standardState = "retired"
      status.className = "status st-red standard-status"
      status.innerHTML = '<span class="dot"></span>לא בתוקף'
      return toast.success("התקן הועבר לסטטוס לא בתוקף")
    }
    if (["new-version", "clone"].includes(action)) return toast.success("נוצרה טיוטת גרסה חדשה")
    if (action === "edit-draft") return openDetails(row, "עריכת טיוטת תקן")
    return openDetails(row, "פרטי תקן")
  }

  function handleRequirementAction(action) {
    if (action === "add") return setDialog({ type: "form", formType: "requirement" })
    if (action === "export") return downloadReport("כרטיסי דרישה")
    if (action === "traceability") {
      const template = dialogs.traceability
      return setDialog({
        type: "details",
        chip: dialogChip,
        ...template,
      })
    }

    const clause = { "filter-ai": "7.16", "filter-cyber": "7.6", "filter-test": "7.12" }[action]
    if (clause) {
      contentRef.current?.querySelectorAll("#requirements-grid .requirement-card").forEach((card) => {
        card.classList.toggle("mock-hidden-by-requirement-filter", card.dataset.clause !== clause)
      })
      toast.success(`מוצגות דרישות מסעיף ${clause}`)
    }
  }

  function handleMessageAction(action) {
    const destinations = {
      "open-projects": "projects",
      "open-controls": "controls",
      "open-reports": "reports",
      "open-compliance": "compliance",
      "open-admin": "admin",
      "open-messages": "messages",
    }
    if (destinations[action]) return navigate(destinations[action])
    if (action === "export-notifications") return downloadReport("התראות והודעות")
    if (action === "mark-all-read") {
      contentRef.current?.querySelectorAll(".message-item.unread").forEach((item) => item.classList.remove("unread"))
      setUnreadCount(0)
      return toast.success("כל ההודעות סומנו כנקראו")
    }
  }

  function handleMessageFilter(filter) {
    contentRef.current?.querySelectorAll("#screen-messages .message-item").forEach((item) => {
      const matches = filter === "unread" ? item.classList.contains("unread") : item.dataset.messageType === filter
      item.classList.toggle("mock-hidden-by-message-filter", !matches)
    })
    toast.success("ההודעות סוננו")
  }

  function handleContentClick(event) {
    const target = event.target
    const goScreen = target.closest("[data-go-screen]")
    if (goScreen) return navigate(goScreen.dataset.goScreen)

    const standardAction = target.closest("[data-standard-action]")
    if (standardAction) return handleStandardAction(standardAction.dataset.standardAction, standardAction)

    const requirementAction = target.closest("[data-requirement-action]")
    if (requirementAction) return handleRequirementAction(requirementAction.dataset.requirementAction)

    const messageAction = target.closest("[data-message-action]")
    if (messageAction) return handleMessageAction(messageAction.dataset.messageAction)

    const messageFilter = target.closest("[data-message-filter]")
    if (messageFilter) return handleMessageFilter(messageFilter.dataset.messageFilter)

    const newUserButton = target.closest("#screen-admin .btn-outline")
    if (newUserButton) return setDialog({ type: "form", formType: "user" })

    const reportAction = target.closest(".action-icons button, .feature-link")
    if (reportAction) {
      const title = reportAction.title || cleanText(reportAction.closest("tr, .feature-card")) || "דוח GRC"
      if (reportAction.title?.includes("הורדה")) return downloadReport(title)
      return openDetails(reportAction.closest("tr, .feature-card"), title)
    }

    const clickable = target.closest(
      ".requirement-card, .message-item, .kpi-card, .feature-card, .task-item, .gap-item, table.data tbody tr, .link-blue, .bar-col, .chart-legend span, .line-chart-svg, .panel-link",
    )
    if (clickable) {
      if (clickable.classList.contains("message-item")) {
        clickable.classList.remove("unread")
        setUnreadCount((count) => Math.max(0, count - 1))
      }
      openDetails(clickable)
    }
  }

  function handleContentKeyDown(event) {
    if (!["Enter", " "].includes(event.key) || event.target.matches("input, textarea, select, button")) return
    if (event.target.classList.contains("mock-clickable")) {
      event.preventDefault()
      event.target.click()
    }
  }

  function addUser(formData) {
    const tbody = contentRef.current?.querySelector("#screen-admin table.data tbody")
    if (!tbody) return
    const row = document.createElement("tr")
    row.className = "mock-new-row mock-clickable"
    row.tabIndex = 0
    row.innerHTML = `
      <td><span class="cell-title">${escapeHtml(formData.get("fullName"))}</span></td>
      <td>${escapeHtml(formData.get("username"))}</td>
      <td>${escapeHtml(formData.get("role"))}</td>
      <td>${escapeHtml(formData.get("department"))}</td>
      <td>${escapeHtml(formData.get("email"))}</td>
      <td><span class="status st-green"><span class="dot"></span>פעיל</span></td>
      <td>${new Date().toLocaleDateString("he-IL")}</td>
      <td><button class="kebab" aria-label="פעולות"><svg width="17" height="17"><use href="#i-dots"/></svg></button></td>`
    tbody.prepend(row)
  }

  function addStandard(formData) {
    const tbody = contentRef.current?.querySelector("#standards-table tbody")
    if (!tbody) return
    const row = document.createElement("tr")
    row.dataset.standardState = "draft"
    row.className = "mock-new-row mock-clickable"
    row.tabIndex = 0
    row.innerHTML = `
      <td><span class="cell-title">${escapeHtml(formData.get("name"))}</span><span class="row-note">תקן חדש שנוצר במערכת</span></td>
      <td>${escapeHtml(formData.get("version"))}</td>
      <td>${escapeHtml(formData.get("owner"))}</td>
      <td><span class="status st-blue standard-status"><span class="dot"></span>טיוטה</span></td>
      <td>${new Date().toLocaleDateString("he-IL")}</td><td>0</td>
      <td><span class="action-icons standard-actions"><button title="עדכון טיוטה" data-standard-action="edit-draft"><svg><use href="#i-file-text"/></svg></button><button title="פרסם" data-standard-action="publish"><svg><use href="#i-shield-check"/></svg></button></span></td>`
    tbody.prepend(row)
  }

  function addRequirement(formData) {
    const grid = contentRef.current?.querySelector("#requirements-grid")
    if (!grid) return
    const article = document.createElement("article")
    article.className = "requirement-card mock-new-row mock-clickable"
    article.tabIndex = 0
    article.dataset.clause = formData.get("clause")
    article.dataset.owner = formData.get("owner")
    article.dataset.evidence = formData.get("evidence")
    article.dataset.requirementTitle = formData.get("title")
    article.innerHTML = `
      <div class="req-head"><span class="req-id">RQ-NEW</span><span class="status st-blue"><span class="dot"></span>חדש</span></div>
      <h3>${escapeHtml(formData.get("title"))}</h3>
      <p>כרטיס דרישה חדש שנוצר במערכת וממתין להשלמת מיפוי ובדיקה.</p>
      <div class="req-map"><span>תקן ארגוני</span><span>פרק ${escapeHtml(formData.get("clause"))}</span><span>${escapeHtml(formData.get("owner"))}</span></div>`
    grid.prepend(article)
  }

  function handleFormSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    if (dialog.formType === "user") addUser(formData)
    if (dialog.formType === "standard") addStandard(formData)
    if (dialog.formType === "requirement") addRequirement(formData)
    setDialog(null)
    toast.success("הפריט נשמר בהצלחה")
  }

  function handleUserAction(action) {
    const userDialogs = dialogs.user
    const template = userDialogs[action]
    const currentUser = applicationData.currentUser
    setDialog({
      type: "details",
      chip: dialogChip,
      title: template.title,
      description: template.description,
      meta: action === "logout" ? [] : [
        { label: userDialogs.metaLabels.user, value: currentUser.name },
        { label: userDialogs.metaLabels.role, value: currentUser.role },
        { label: userDialogs.metaLabels.status, value: currentUser.status },
      ],
      actions: action === "logout"
        ? userDialogs.logoutActions
        : userDialogs.actions,
    })
  }

  function openNotifications() {
    const template = dialogs.notifications
    setDialog({
      type: "details",
      chip: dialogChip,
      title: template.title,
      description: unreadCount
        ? template.descriptionTemplate.replace("{count}", unreadCount)
        : template.emptyDescription,
      items: applicationData.notifications.items,
      actions: template.actions,
    })
  }

  function handleDialogAction(action) {
    if (action === "export-current") return downloadReport(dialog.title)
    if (action === "open-messages") {
      setDialog(null)
      return navigate("messages")
    }
    if (action === "open-projects") {
      setDialog(null)
      return navigate("projects")
    }
    if (action === "mark-all-read") {
      handleMessageAction("mark-all-read")
      setDialog(null)
      return
    }
    if (action === "close") return setDialog(null)

    const messages = {
      "open-record": "התיק המלא נפתח",
      "update-status": "סטטוס הרשומה עודכן",
      "take-ownership": "המשימה שויכה אליך",
      "create-followup": "נפתחה משימת המשך",
      "complete-task": "המשימה סומנה כבוצעה",
      "drill-down": "תצוגת העומק נפתחה",
      "save-settings": "ההגדרות נשמרו",
    }
    setDialog(null)
    toast.success(messages[action] || "הפעולה בוצעה בהצלחה")
  }

  if (loadError) {
    return (
      <div className="api-state" dir="rtl">
        <h1>לא ניתן לטעון את נתוני המערכת</h1>
        <p>ודא ש־GRC-BACKEND פועל בכתובת {API_BASE_URL} ורענן את הדף.</p>
        <code>{loadError}</code>
      </div>
    )
  }

  if (!applicationData) {
    return <div className="api-state" dir="rtl"><p>טוען נתונים מ־GRC-BACKEND…</p></div>
  }

  return (
    <div className="grc-app" dir="rtl">
      <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: iconSprite }} />
      <AppHeader
        appInfo={applicationData.app}
        currentUser={applicationData.currentUser}
        query={query}
        unreadCount={unreadCount}
        onQueryChange={setQuery}
        onNotifications={openNotifications}
        onUserAction={handleUserAction}
      />
      <MainNavigation items={navigationItems} activeScreen={activeScreen} onNavigate={navigate} />
      <main
        ref={contentRef}
        onClick={handleContentClick}
        onKeyDown={handleContentKeyDown}
        dangerouslySetInnerHTML={{ __html: screensMarkup }}
      />

      <Dialog open={Boolean(dialog)} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="mock-modal grc-dialog-content" dir="rtl">
          {dialog?.type === "form" ? (
            <EntityForm config={forms[dialog.formType]} chip={dialogChip} onSubmit={handleFormSubmit} onCancel={() => setDialog(null)} />
          ) : dialog ? (
            <>
              <DetailsDialog dialog={dialog} />
              <div className="mock-modal-actions">
                {(dialog.actions || dialogs.generic.actions).map((item) => (
                  <Button
                    key={`${item.action}-${item.label}`}
                    variant={item.primary ? "default" : "outline"}
                    className={`mock-action ${item.primary ? "primary" : ""}`}
                    onClick={() => handleDialogAction(item.action)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
