import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import ContentEditor from "@/components/cms/ContentEditor"
import { defaultContent } from "@/lib/site-content"
const navigation = vi.hoisted(() => ({ query: "" }))
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(navigation.query) }))
const initial = { draft: defaultContent, version: 0, revisions: [] }
beforeEach(() => { vi.restoreAllMocks(); navigation.query = "" })
describe("content editor workflow", () => {
  it("adds services to a saved draft without silently publishing them", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, options) => {
      if (options?.method === "PUT") {
        const body = JSON.parse(String(options.body))
        return new Response(JSON.stringify({ draft: body.content, version: 1, message: "Draft saved." }))
      }
      return new Response(JSON.stringify(initial))
    })
    render(<ContentEditor />)
    fireEvent.click(await screen.findByRole("button", { name: /^Services$/ }))
    fireEvent.click(screen.getByRole("button", { name: "+ Add Service" }))
    const descriptions = screen.getAllByLabelText("Description")
    const description = descriptions[descriptions.length - 1]
    fireEvent.change(description, { target: { value: "Describe the new service" } })
    expect(description).toBeVisible()
    const durations = screen.getAllByLabelText("Appointment duration (minutes)")
    fireEvent.change(durations[durations.length - 1], { target: { value: "20" } })
    expect(screen.getByRole("button", { name: "Publish Changes" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }))
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Draft saved"))
    const writes = fetch.mock.calls.filter(([, options]) => options?.method === "PUT").map(([, options]) => JSON.parse(String(options?.body)))
    expect(writes).toHaveLength(1)
    expect(writes[0].action).toBe("save")
    expect(writes[0].content.services).toHaveLength(defaultContent.services.length + 1)
    expect(writes[0].content.services.at(-1)).toMatchObject({ duration: 20, description: "Describe the new service" })
    expect(writes[0].content.services.find((service: { id: string }) => service.id === "cleaning").duration).toBe(30)
    expect(screen.getByRole("button", { name: "Publish Changes" })).toBeEnabled()
  })
  it("retains unsaved work when another editor has saved a newer version", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, options) => options?.method === "PUT" ? new Response(JSON.stringify({ error: "This content changed in another tab." }), { status: 409 }) : new Response(JSON.stringify(initial)))
    render(<ContentEditor />)
    fireEvent.click(await screen.findByRole("button", { name: /^FAQs$/ }))
    fireEvent.click(screen.getByRole("button", { name: "+ Add Question" }))
    const questions = screen.getAllByLabelText("Question")
    fireEvent.change(questions[questions.length - 1], { target: { value: "My unsaved question" } })
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }))
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("another tab"))
    expect(screen.getByDisplayValue("My unsaved question")).toBeInTheDocument()
  })
  it("opens the services section directly and saves its replacement image and text", async () => {
    navigation.query = "tab=services"
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options) => {
      if (String(url) === "/api/admin/upload") return new Response(JSON.stringify({ url: "/media/products/cleaning-new.jpg" }))
      if (options?.method === "PUT") {
        const body = JSON.parse(String(options.body))
        return new Response(JSON.stringify({ draft: body.content, version: 1, message: "Draft saved." }))
      }
      return new Response(JSON.stringify(initial))
    })
    render(<ContentEditor />)
    expect(await screen.findByRole("heading", { name: "Homepage services section" })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Section heading"), { target: { value: "Care for your jewelry" } })
    fireEvent.change(screen.getByLabelText("Upload Services photo"), { target: { files: [new File(["image"], "cleaning.jpg", { type: "image/jpeg" })] } })
    await waitFor(() => expect(screen.getByLabelText("Services photo")).toHaveValue("/media/products/cleaning-new.jpg"))
    expect(screen.getByRole("img", { name: "Services photo preview" })).toHaveAttribute("src", "/media/products/cleaning-new.jpg")
    fireEvent.click(screen.getByRole("button", { name: "Save Draft" }))
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Draft saved"))
    const write = fetch.mock.calls.find(([, options]) => options?.method === "PUT")
    expect(JSON.parse(String(write?.[1]?.body)).content.copy).toMatchObject({ "services.image": "/media/products/cleaning-new.jpg", "services.title": "Care for your jewelry" })
  })
  it("keeps the current services image when a replacement upload fails", async () => {
    navigation.query = "tab=services"
    vi.spyOn(globalThis, "fetch").mockImplementation(async url => String(url) === "/api/admin/upload" ? new Response(JSON.stringify({ error: "Storage is unavailable." }), { status: 503 }) : new Response(JSON.stringify(initial)))
    render(<ContentEditor />)
    await screen.findByRole("heading", { name: "Homepage services section" })
    fireEvent.change(screen.getByLabelText("Upload Services photo"), { target: { files: [new File(["image"], "cleaning.jpg", { type: "image/jpeg" })] } })
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Storage is unavailable"))
    expect(screen.getByLabelText("Services photo")).toHaveValue(defaultContent.copy["services.image"])
  })

})
